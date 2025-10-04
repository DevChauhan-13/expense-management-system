import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses, users, expenseApprovals } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stats: any = {};

    if (currentUser.role === "admin") {
      // Admin stats: all company expenses
      const allExpenses = await db.query.expenses.findMany({
        where: eq(expenses.companyId, currentUser.companyId!),
      });

      const totalExpenses = allExpenses.length;
      const pendingCount = allExpenses.filter((e) => e.status === "pending").length;
      const approvedCount = allExpenses.filter((e) => e.status === "approved").length;
      const rejectedCount = allExpenses.filter((e) => e.status === "rejected").length;
      const totalAmount = allExpenses
        .filter((e) => e.status === "approved")
        .reduce((sum, e) => sum + (e.convertedAmount || e.amount), 0);

      stats = {
        totalExpenses,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalAmount,
      };
    } else if (currentUser.role === "manager") {
      // Manager stats: pending approvals count
      const pendingApprovals = await db.query.expenseApprovals.findMany({
        where: and(
          eq(expenseApprovals.approverId, currentUser.id),
          eq(expenseApprovals.status, "pending")
        ),
      });

      stats = {
        pendingApprovals: pendingApprovals.length,
      };
    } else {
      // Employee stats: own expenses
      const myExpenses = await db.query.expenses.findMany({
        where: eq(expenses.employeeId, currentUser.id),
      });

      const totalExpenses = myExpenses.length;
      const pendingCount = myExpenses.filter((e) => e.status === "pending").length;
      const approvedCount = myExpenses.filter((e) => e.status === "approved").length;
      const rejectedCount = myExpenses.filter((e) => e.status === "rejected").length;

      stats = {
        totalExpenses,
        pendingCount,
        approvedCount,
        rejectedCount,
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}