import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenseApprovals, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const expenseId = parseInt(id);

    // Get all approvals for this expense
    const approvals = await db.query.expenseApprovals.findMany({
      where: eq(expenseApprovals.expenseId, expenseId),
    });

    // Get approver details
    const approvalsWithDetails = await Promise.all(
      approvals.map(async (approval) => {
        const approver = await db.query.users.findFirst({
          where: eq(users.id, approval.approverId!),
        });

        return {
          ...approval,
          approver,
        };
      })
    );

    // Sort by sequence order
    approvalsWithDetails.sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    return NextResponse.json(approvalsWithDetails);
  } catch (error) {
    console.error("Error fetching expense approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense approvals" },
      { status: 500 }
    );
  }
}