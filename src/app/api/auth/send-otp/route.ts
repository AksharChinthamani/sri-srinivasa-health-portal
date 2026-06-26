import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration

    // Save to Firestore
    await adminDb.collection('otps').doc(email).set({
      code: otp,
      expiresAt: expiresAt.getTime(),
      createdAt: new Date().getTime(),
    });

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (user && pass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user,
          pass: pass,
        },
      });

      const mailOptions = {
        from: `Sri Srinivasa Health Portal <${user}>`,
        to: email,
        subject: 'Your Login Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 8px;">
            <h2 style="color: #0f766e; text-align: center;">Secure Login</h2>
            <p style="font-size: 16px; color: #333;">Your 6-digit verification code is:</p>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #e5e7eb;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f766e;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">This code will expire in 5 minutes. Do not share this code with anyone.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[OTP Sent to ${email}] (via Nodemailer)`);
    } else {
      console.warn('⚠️ No GMAIL_USER or GMAIL_APP_PASSWORD found in .env.local. Printing OTP to console instead:');
      console.log('====================================');
      console.log(`Email: ${email}`);
      console.log(`OTP Code: ${otp}`);
      console.log('====================================');
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
