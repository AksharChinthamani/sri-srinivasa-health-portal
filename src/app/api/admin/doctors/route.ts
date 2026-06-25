export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';

// GET - List all doctors
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctorsSnap = await adminDb.collection('users').where('role', '==', 'DOCTOR').get();
    
    const doctors = doctorsSnap.docs.map((docSnap: any) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || data.displayName,
        email: data.email,
        phone: data.phone || '',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        doctorProfile: {
          id: docSnap.id,
          specialty: data.specialty || 'General',
          qualifications: data.qualifications || '',
          experience: data.experience || 0,
        },
      };
    });

    // Sort descending by createdAt
    doctors.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Fetch admin doctors error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin doctors' }, { status: 500 });
  }
}

// POST - Create a new doctor account (Admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, password, specialty, qualifications, experience } = await req.json();

    if (!name || !email || !password || !specialty) {
      return NextResponse.json({ error: 'Name, email, password and specialty are required' }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone || undefined,
    });

    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'DOCTOR' });

    // Store in Firestore
    const doctorData = {
      name,
      email,
      phone: phone || '',
      role: 'DOCTOR',
      specialty,
      qualifications: qualifications || '',
      experience: Number(experience) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(doctorData);

    return NextResponse.json({ 
      success: true, 
      doctor: { id: userRecord.uid, ...doctorData, doctorProfile: doctorData } 
    });
  } catch (error: any) {
    console.error('Create doctor error:', error);
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    if (error.code === 'auth/invalid-phone-number') {
      return NextResponse.json({ error: 'Invalid phone format. Please include country code (e.g. +91)' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a doctor account (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { doctorId } = await req.json();
    if (!doctorId) {
      return NextResponse.json({ error: 'doctorId is required' }, { status: 400 });
    }

    // Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(doctorId);
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
    }

    // Delete from Firestore
    await adminDb.collection('users').doc(doctorId).delete();

    // Note: In a complete migration we would also delete related appointments, prescriptions, etc.
    // For now we assume they can remain orphaned or be deleted by a Cloud Function trigger.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete doctor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
