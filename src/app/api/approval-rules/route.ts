import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { approvalRules, approvalRuleApprovers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await db.query.approvalRules.findMany({
      where: eq(approvalRules.companyId, currentUser.companyId!),
      with: {
        approvers: {
          with: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching approval rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      ruleName,
      isManagerApprover,
      approvalType,
      percentageRequired,
      specificApproverId,
      approvers,
    } = body;

    // Create approval rule
    const [newRule] = await db
      .insert(approvalRules)
      .values({
        companyId: currentUser.companyId!,
        ruleName,
        isManagerApprover,
        approvalType,
        percentageRequired,
        specificApproverId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Add approvers
    if (approvers && approvers.length > 0) {
      for (const approver of approvers) {
        await db.insert(approvalRuleApprovers).values({
          approvalRuleId: newRule.id,
          approverId: approver.userId,
          sequenceOrder: approver.sequenceOrder,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(newRule);
  } catch (error) {
    console.error("Error creating approval rule:", error);
    return NextResponse.json(
      { error: "Failed to create approval rule" },
      { status: 500 }
    );
  }
}