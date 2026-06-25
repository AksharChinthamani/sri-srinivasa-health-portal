import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let snapshot;
    if (user.role === 'PATIENT') {
      snapshot = await adminDb.collection('prescriptions')
        .where('patientId', '==', user.id)
        .get();
    } else if (user.role === 'DOCTOR') {
      snapshot = await adminDb.collection('prescriptions')
        .where('doctorId', '==', user.id)
        .get();
    } else {
      snapshot = await adminDb.collection('prescriptions')
        .get();
    }

    const prescriptions = await Promise.all(snapshot.docs.map(async (docSnap: any) => {
      const data = docSnap.data();
      
      let doctorData = null;
      if (data.doctorId) {
        try {
          const docUserSnap = await adminDb.collection('users').doc(data.doctorId).get();
          if (docUserSnap.exists) {
            const dUser = docUserSnap.data();
            doctorData = {
              specialty: dUser?.specialty || 'General Practitioner',
              user: {
                name: dUser?.name || 'Doctor',
              }
            };
          }
        } catch (e) {
          console.error('Error fetching doctor data for prescription', e);
        }
      }

      let issuedAtIso = new Date().toISOString();
      if (data.issuedAt) {
        if (typeof data.issuedAt.toDate === 'function') {
          issuedAtIso = data.issuedAt.toDate().toISOString();
        } else if (typeof data.issuedAt === 'string') {
          issuedAtIso = new Date(data.issuedAt).toISOString();
        } else if (data.issuedAt.seconds) {
          issuedAtIso = new Date(data.issuedAt.seconds * 1000).toISOString();
        }
      }

      return {
        id: docSnap.id,
        ...data,
        doctor: doctorData,
        issuedAt: issuedAtIso
      };
    }));

    prescriptions.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Fetch prescriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !['DOCTOR', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { patientId, notes, expiresAt, medicines, fileUrl, filePath, fileName, appointmentId } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    const hasMedicines = medicines && Array.isArray(medicines) && medicines.length > 0;
    if (!hasMedicines && !fileUrl) {
      return NextResponse.json({ error: 'Must provide either medicines or an attached file' }, { status: 400 });
    }

    let doctorId = user.id;
    if (user.role === 'ADMIN' && body.doctorId) {
      doctorId = body.doctorId;
    }

    const expiration = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // default 30 days

    const prescriptionRef = doc(collection(db, 'prescriptions'));
    const prescriptionData = {
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      notes: notes || '',
      expiresAt: expiration.toISOString(),
      issuedAt: serverTimestamp(),
      status: 'active',
      medicines: hasMedicines ? medicines.map((m: any) => ({
        medicineName: m.medicineName,
        dosage: m.dosage || 'Standard',
        frequency: m.frequency || 'Once daily',
        duration: m.duration || '7 days',
        instructions: m.instructions || '',
      })) : [],
      fileUrl: fileUrl || null,
      filePath: filePath || null,
      fileName: fileName || null,
    };

    await setDoc(prescriptionRef, prescriptionData);

    return NextResponse.json({ id: prescriptionRef.id, ...prescriptionData });
  } catch (error) {
    console.error('Create prescription error:', error);
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
  }
}
