import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenseApprovals, expenses, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all pending approvals for this user
    const userApprovals = await db.query.expenseApprovals.findMany({
      where: and(
        eq(expenseApprovals.approverId, currentUser.id),
        eq(expenseApprovals.status, "pending")
      ),
      with: {
        expense: {
          with: {
            employee: true,
          },
        },
      },
      orderBy: [desc(expenseApprovals.createdAt)],
    });

    return NextResponse.json(userApprovals);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { approvalId, status, comments } = body;

    // Update approval
    const [updatedApproval] = await db
      .update(expenseApprovals)
      .set({
        status,
        comments,
        approvedAt: new Date().toISOString(),
      })
      .where(eq(expenseApprovals.id, approvalId))
      .returning();

    // If rejected, update expense status
    if (status === "rejected") {
      await db
        .update(expenses)
        .set({ status: "rejected" })
        .where(eq(expenses.id, updatedApproval.expenseId));
    } else if (status === "approved") {
      // Check if all approvals are complete
      const allApprovals = await db.query.expenseApprovals.findMany({
        where: eq(expenseApprovals.expenseId, updatedApproval.expenseId),
      });

      const allApproved = allApprovals.every((a) => a.status === "approved");

      if (allApproved) {
        await db
          .update(expenses)
          .set({ status: "approved" })
          .where(eq(expenses.id, updatedApproval.expenseId));
      }
    }

    return NextResponse.json(updatedApproval);
  } catch (error) {
    console.error("Error updating approval:", error);
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}