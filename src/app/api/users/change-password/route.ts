import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 });
    }

    const requestBody = await request.json();
    const { email, oldPassword, newPassword } = requestBody;

    // Security: Reject user ID fields if provided
    if ('userId' in requestBody || 'user_id' in requestBody || 'id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!email) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!oldPassword) {
      return NextResponse.json({ 
        error: "Current password is required",
        code: "MISSING_OLD_PASSWORD" 
      }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ 
        error: "New password is required",
        code: "MISSING_NEW_PASSWORD" 
      }, { status: 400 });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: "New password must be at least 8 characters long",
        code: "WEAK_PASSWORD" 
      }, { status: 400 });
    }

    // Normalize email for comparison
    const normalizedEmail = email.toLowerCase().trim();
    const currentUserEmail = currentUser.email.toLowerCase().trim();

    // Authorization: Verify user can only change their own password
    if (normalizedEmail !== currentUserEmail) {
      return NextResponse.json({ 
        error: "You can only change your own password",
        code: "UNAUTHORIZED_PASSWORD_CHANGE" 
      }, { status: 403 });
    }

    // Verify the user exists in database
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Make internal API call to better-auth changePassword endpoint
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'
      : 'http://localhost:3000';

    const changePasswordResponse = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        currentPassword: oldPassword,
        newPassword: newPassword,
      }),
    });

    if (!changePasswordResponse.ok) {
      const errorData = await changePasswordResponse.json().catch(() => ({}));
      
      if (changePasswordResponse.status === 400) {
        return NextResponse.json({ 
          error: errorData.message || "Invalid current password or password change failed",
          code: "PASSWORD_CHANGE_FAILED" 
        }, { status: 400 });
      }

      if (changePasswordResponse.status === 401) {
        return NextResponse.json({ 
          error: "Current password is incorrect",
          code: "INCORRECT_OLD_PASSWORD" 
        }, { status: 400 });
      }

      throw new Error(`Better-auth API error: ${changePasswordResponse.status}`);
    }

    // Log password change event for security
    console.log(`Password changed successfully for user: ${currentUser.id} (${currentUser.email}) at ${new Date().toISOString()}`);

    // Return success response
    return NextResponse.json({
      message: "Password changed successfully",
      success: true,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('POST password change error:', error);
    
    // Handle specific better-auth errors
    if (error instanceof Error && error.message.includes('Better-auth API error')) {
      return NextResponse.json({ 
        error: 'Password change service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE'
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}