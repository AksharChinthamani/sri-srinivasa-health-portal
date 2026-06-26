import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 });
    }

    // 1. Fetch OTP record
    const otpRef = adminDb.collection('otps').doc(email);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    const data = otpDoc.data();

    // 2. Check if expired
    if (!data || Date.now() > data.expiresAt) {
      // Delete expired code
      await otpRef.delete();
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // 3. Verify Code
    if (data.code !== code.toString()) {
      return NextResponse.json({ error: 'Incorrect OTP code.' }, { status: 400 });
    }

    // 4. Code is valid! Delete it from DB so it can't be reused
    await otpRef.delete();

    // 5. Get or Create Firebase Auth User
    let uid = '';
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Create new user if they don't exist
        const newUser = await adminAuth.createUser({
          email: email,
          displayName: email.split('@')[0], // Basic fallback name
        });
        uid = newUser.uid;
        
        // Ensure a user document exists in Firestore
        await adminDb.collection('users').doc(uid).set({
          uid: uid,
          email: email,
          name: email.split('@')[0],
          role: 'PATIENT',
          createdAt: new Date().toISOString()
        });
      } else {
        throw err;
      }
    }

    // 6. Generate Custom Token
    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ 
      success: true, 
      customToken,
      message: 'OTP verified successfully' 
    });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while verifying the code.' },
      { status: 500 }
    );
  }
}
