import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, companyName, currency } = body;

    // Check if user already exists in custom table
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Create company
    const [company] = await db
      .insert(companies)
      .values({
        name: companyName,
        defaultCurrency: currency,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // Create admin user in custom users table
    await db.insert(users).values({
      email,
      name,
      password: "auth_handled_by_better_auth",
      role: "admin",
      companyId: company.id,
      managerId: null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
    });
  } catch (error) {
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { error: "Failed to set up admin account" },
      { status: 500 }
    );
  }
}