import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List appointments based on role
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let snapshot;
    if (user.role === 'PATIENT') {
      snapshot = await adminDb.collection('appointments')
        .where('patientId', '==', user.id)
        .get();
    } else if (user.role === 'DOCTOR') {
      snapshot = await adminDb.collection('appointments')
        .where('doctorId', '==', user.id)
        .get();
    } else {
      snapshot = await adminDb.collection('appointments')
        .get();
    }

    const appointments = await Promise.all(snapshot.docs.map(async docSnap => {
      const data = docSnap.data();
      let patientData = null;
      let doctorData = null;

      // Populate patient info if needed
      if (data.patientId) {
        const patientUserSnap = await adminDb.collection('users').doc(data.patientId).get();
        const pUser = patientUserSnap.data() || {};
        patientData = {
          id: data.patientId,
          bloodGroup: pUser.bloodGroup || null,
          user: {
            id: patientUserSnap.id,
            name: pUser.name || 'Unknown Patient',
            email: pUser.email || '',
            phone: pUser.phone || '',
          }
        };
      }

      // Populate doctor info if needed
      if (data.doctorId) {
        const docUserSnap = await adminDb.collection('users').doc(data.doctorId).get();
        const dUser = docUserSnap.data() || {};
        doctorData = {
          id: data.doctorId,
          user: {
            name: dUser.name || 'Unknown Doctor',
            specialty: dUser.specialty || 'General',
          }
        };
      }

      return {
        id: docSnap.id,
        ...data,
        status: (data.status || 'PENDING').toUpperCase(),
        patient: patientData,
        doctor: doctorData,
      };
    }));

    appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Fetch appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// POST - Book a new appointment
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { doctorId, date, time, reason, notes, type } = body;

    if (!doctorId || !date || !time) {
      return NextResponse.json({ error: 'doctorId, date, and time are required' }, { status: 400 });
    }

    // Validate that slot isn't already booked for the doctor
    const doctorConflicts = await adminDb.collection('appointments')
      .where('doctorId', '==', doctorId)
      .where('date', '==', date)
      .where('time', '==', time)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();
      
    if (!doctorConflicts.empty) {
      return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 });
    }

    // Validate patient doesn't double book
    const patientConflicts = await adminDb.collection('appointments')
      .where('patientId', '==', user.id)
      .where('date', '==', date)
      .where('time', '==', time)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();
      
    if (!patientConflicts.empty) {
      return NextResponse.json({
        error: 'You already have an appointment booked at this time on this day. Please select a different time or date.'
      }, { status: 409 });
    }

    const appointmentData = {
      patientId: user.id,
      doctorId,
      date,
      time,
      reason: reason || '',
      notes: notes || '',
      type: type || 'virtual',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('appointments').add(appointmentData);

    return NextResponse.json({ id: docRef.id, ...appointmentData });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

// PUT/PATCH - Update appointment status
export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !['ADMIN', 'DOCTOR', 'PATIENT'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, notes, date, time } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const appointmentRef = adminDb.collection('appointments').doc(id);
    const appointmentSnap = await appointmentRef.get();

    if (!appointmentSnap.exists) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const appointment = appointmentSnap.data();

    if (user.role === 'PATIENT') {
      if (appointment.patientId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (date && time && (date !== appointment.date || time !== appointment.time)) {
      const doctorConflicts = await adminDb.collection('appointments')
        .where('doctorId', '==', appointment.doctorId)
        .where('date', '==', date)
        .where('time', '==', time)
        .where('status', 'in', ['pending', 'confirmed', 'PENDING', 'CONFIRMED'])
        .get();
        
      if (!doctorConflicts.empty) {
        const isSameApp = doctorConflicts.docs.length === 1 && doctorConflicts.docs[0].id === id;
        if (!isSameApp) {
          return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 });
        }
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    if (status !== undefined) updateData.status = status.toUpperCase();
    if (notes !== undefined) updateData.notes = notes;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;

    await appointmentRef.update(updateData);

    return NextResponse.json({ id, ...appointment, ...updateData });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
