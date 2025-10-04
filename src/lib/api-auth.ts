import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get current user from either session-based auth or bearer token auth
 * This helper supports hybrid authentication for API routes
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    // Better-auth automatically handles both session cookies and bearer tokens
    // when the bearer plugin is enabled
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (session?.user) {
      // Get full user details from the users table
      const currentUser = await db.query.users.findFirst({
        where: eq(users.email, session.user.email),
      });
      return currentUser;
    }

    return null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}