import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses, expenseApprovals, users, approvalRules, approvalRuleApprovers } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userExpenses;

    if (currentUser.role === "admin") {
      // Admin can see all expenses
      userExpenses = await db.query.expenses.findMany({
        where: eq(expenses.companyId, currentUser.companyId!),
        orderBy: [desc(expenses.createdAt)],
      });
    } else if (currentUser.role === "employee") {
      // Employee can only see their own expenses
      userExpenses = await db.query.expenses.findMany({
        where: eq(expenses.employeeId, currentUser.id),
        orderBy: [desc(expenses.createdAt)],
      });
    } else if (currentUser.role === "manager") {
      // Manager can see expenses from their direct reports and their own
      const directReports = await db.query.users.findMany({
        where: eq(users.managerId, currentUser.id),
      });

      const directReportIds = directReports.map(user => user.id);
      const allUserIds = [...directReportIds, currentUser.id];

      userExpenses = await db.query.expenses.findMany({
        where: inArray(expenses.employeeId, allUserIds),
        orderBy: [desc(expenses.createdAt)],
      });
    } else if (["CFO", "director", "finance"].includes(currentUser.role)) {
      // CFO/director/finance can see expenses where they are in the approval chain
      const approvalsForUser = await db.query.expenseApprovals.findMany({
        where: eq(expenseApprovals.approverId, currentUser.id),
      });

      const expenseIds = approvalsForUser.map((a) => a.expenseId);

      if (expenseIds.length > 0) {
        userExpenses = await db.query.expenses.findMany({
          where: inArray(expenses.id, expenseIds),
          orderBy: [desc(expenses.createdAt)],
        });
      } else {
        userExpenses = [];
      }
    } else {
      userExpenses = [];
    }

    return NextResponse.json(userExpenses || []);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, originalCurrency, category, description, expenseDate } = body;

    // Validate required fields
    if (!amount || !originalCurrency || !category || !description || !expenseDate) {
      return NextResponse.json({ 
        error: "All fields are required: amount, originalCurrency, category, description, expenseDate" 
      }, { status: 400 });
    }

    // Get company default currency
    const companies = await db.query.companies.findMany({});
    const company = companies.find(c => c.id === currentUser.companyId);

    if (!company) {
      return NextResponse.json({ 
        error: "Company not found for user" 
      }, { status: 400 });
    }

    let convertedAmount = amount;

    // Convert currency if different from company default
    if (originalCurrency !== company.defaultCurrency) {
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${originalCurrency}`
        );
        if (response.ok) {
          const data = await response.json();
          convertedAmount = amount * (data.rates[company.defaultCurrency] || 1);
        }
      } catch (error) {
        console.error("Currency conversion failed:", error);
      }
    }

    // Create expense
    const [newExpense] = await db
      .insert(expenses)
      .values({
        employeeId: currentUser.id,
        amount,
        originalCurrency,
        convertedAmount,
        category,
        description,
        expenseDate,
        status: "pending",
        companyId: currentUser.companyId!,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Get the first (default) approval rule for the company
    const rules = await db.query.approvalRules.findMany({
      where: eq(approvalRules.companyId, currentUser.companyId!),
    });

    if (rules.length === 0) {
      console.warn("No approval rules found for company, expense created without approvals");
      return NextResponse.json(newExpense, { status: 201 });
    }

    // Use the first rule as the default
    const rule = rules[0];

    // Create approval workflow based on the rule
    let currentSequence = 1;

    // Step 1: Add manager as first approver if enabled
    if (rule.isManagerApprover && currentUser.managerId) {
      await db.insert(expenseApprovals).values({
        expenseId: newExpense.id,
        approverId: currentUser.managerId,
        sequenceOrder: currentSequence,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      currentSequence++;
    }

    // Step 2: Get and add configured approvers from the rule
    const ruleApprovers = await db.query.approvalRuleApprovers.findMany({
      where: eq(approvalRuleApprovers.approvalRuleId, rule.id),
    });

    // Sort by sequence order and add them
    const sortedApprovers = ruleApprovers.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    
    for (const approver of sortedApprovers) {
      await db.insert(expenseApprovals).values({
        expenseId: newExpense.id,
        approverId: approver.approverId!,
        sequenceOrder: currentSequence,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      currentSequence++;
    }

    console.log(`Created expense ${newExpense.id} with ${currentSequence - 1} approval steps`);

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense: " + error },
      { status: 500 }
    );
  }
}