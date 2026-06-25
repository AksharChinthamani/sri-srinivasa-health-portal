import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DAILY_SLOTS = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00'
];

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');

    // Fetch all users with role DOCTOR
    const doctorsQ = query(collection(db, 'users'), where('role', '==', 'DOCTOR'));
    const doctorsSnap = await getDocs(doctorsQ);
    const doctorProfiles = doctorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // Query all non-cancelled appointments for this date to compute availability
    let appointments: { doctorId: string; time: string }[] = [];
    if (dateStr) {
      const apptsQ = query(
        collection(db, 'appointments'),
        where('date', '==', dateStr),
        where('status', 'in', ['pending', 'confirmed'])
      );
      const apptsSnap = await getDocs(apptsQ);
      apptsSnap.docs.forEach(doc => {
        const data = doc.data();
        appointments.push({ doctorId: data.doctorId, time: data.time });
      });
    }

    const responseData = doctorProfiles.map((profile) => {
      const bookedSlots = new Set(
        appointments
          .filter((app) => app.doctorId === profile.id)
          .map((app) => app.time)
      );

      const availableSlots = DAILY_SLOTS.filter((slot) => !bookedSlots.has(slot));

      return {
        id: profile.id, // For Firestore, doctorId is just userId
        userId: profile.id,
        name: profile.name || profile.displayName || 'Unknown Doctor',
        specialty: profile.specialty || 'General Physician',
        qualifications: profile.qualifications || 'MBBS',
        experience: profile.experience || '5+ years',
        rating: 4.8, // Safe default placeholder
        photo: profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.displayName || 'Doc')}&background=0D8ABC&color=fff`,
        slots: availableSlots,
      };
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Fetch doctors error:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
