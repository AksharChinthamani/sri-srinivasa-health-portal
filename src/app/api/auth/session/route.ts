import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production');

export async function POST(req: NextRequest) {
  try {
    const { token, name, phone } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // 1. Verify Firebase ID Token using official Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);

    const uid = decodedToken.uid;
    const email = decodedToken.email as string;
    const tokenName = decodedToken.name as string;

    const displayName = name || tokenName || (email ? email.split('@')[0] : 'Patient');

    // 2. Determine Role
    let role = 'PATIENT';
    
    // Prefer custom claims role if it exists (set by admin panel)
    if (decodedToken.role) {
      role = decodedToken.role as string;
    } else {
      // Check if Firestore already has a role for this user
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists && userDoc.data()?.role) {
          role = userDoc.data()!.role;
        }
      } catch(e) {}
    }

    // Hardcoded overrides for specific accounts
    if (email === 'adminsrinivas@gmail.com' || email === 'admin@admin.com' || email === 'varu@gmail.com') {
      role = 'ADMIN';
    } else if (email === 'chemistsrinivas@gmail.com' || email === 'chemist@chemist.com') {
      role = 'PHARMACIST';
    }

    // 3. Sync User to Firestore
    try {
      await adminDb.collection('users').doc(uid).set({
        id: uid,
        name: displayName,
        email,
        role,
        phone: phone || null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (dbError: any) {
      console.warn("Failed to sync user to Firestore:", dbError);
      // We don't throw here to allow login to succeed even if Firestore has temporary issues
    }

    // 4. Create Custom JWT for Next.js Middleware
    const customJwt = await new SignJWT({
      id: uid,
      email,
      role,
      name: displayName
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

    cookies().set({
      name: 'token',
      value: customJwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: { id: uid, name: displayName, email, role },
    });
  } catch (error: any) {
    console.error('Session API Error FULL OBJECT:', String(error.stack || error));
    console.error('Token received:', typeof req !== 'undefined' ? 'exists' : 'undefined');
    return NextResponse.json({ error: 'Auth failed', detail: error?.message, code: error?.code }, { status: 401 });
  }
}
