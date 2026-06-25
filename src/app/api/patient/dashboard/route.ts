import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch all independent data concurrently to massively improve speed
    const [appointmentsResult, prescriptionsResult, ordersResult] = await Promise.allSettled([
      getDocs(query(collection(db, 'appointments'), where('patientId', '==', userId))),
      getDocs(query(collection(db, 'prescriptions'), where('patientId', '==', userId))),
      getDocs(query(collection(db, 'orders'), where('patientId', '==', userId), where('status', 'in', ['pending', 'processing'])))
    ]);

    let appointments: any[] = [];
    if (appointmentsResult.status === 'fulfilled') {
      appointments = appointmentsResult.value.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    let prescriptions: any[] = [];
    if (prescriptionsResult.status === 'fulfilled') {
      prescriptions = prescriptionsResult.value.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    }

    let pendingOrders = 0;
    if (ordersResult.status === 'fulfilled') {
      pendingOrders = ordersResult.value.docs.length;
    }

    // Find upcoming appointment
    const upcomingAppointment = appointments.find((app: any) => {
      const s = app.status?.toUpperCase();
      return s === 'CONFIRMED' || s === 'PENDING' || s === 'IN_PROGRESS';
    }) as any;

    let doctorName = 'Doctor';
    let doctorSpecialty = 'General';
    if (upcomingAppointment && upcomingAppointment.doctorId) {
      try {
        const docRef = doc(db, 'users', upcomingAppointment.doctorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const docData = docSnap.data();
          doctorName = docData.name || 'Doctor';
          doctorSpecialty = docData.specialty || 'General';
        }
      } catch (e) {}
    }

    return NextResponse.json({
      upcomingAppointment: upcomingAppointment ? {
        id: upcomingAppointment.id,
        status: upcomingAppointment.status?.toUpperCase(),
        date: upcomingAppointment.date + 'T' + (upcomingAppointment.time || '00:00') + ':00.000Z',
        doctor: doctorName,
        specialty: doctorSpecialty,
      } : null,
      activePrescriptions: prescriptions.length,
      pendingOrders,
      recentRecords: [],
      aiInsight: prescriptions.length > 0
        ? `You have ${prescriptions.length} active prescriptions. Make sure to take them on schedule.`
        : 'All clean! Consider scheduling a regular checkup.',
    });
  } catch (error: any) {
    console.error('Fetch patient dashboard data error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data', detail: error?.message }, { status: 500 });
  }
}
