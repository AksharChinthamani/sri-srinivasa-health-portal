export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch staff (non-patient users)
    const staffQ = query(collection(db, 'users'), where('role', 'in', ['RECEPTIONIST', 'PHARMACIST', 'NURSE', 'DOCTOR', 'ADMIN']));
    const staffSnap = await getDocs(staffQ);
    
    // Fetch shifts
    const shiftsSnap = await getDocs(collection(db, 'shifts'));
    const allShifts = shiftsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // Fetch leave requests
    const leavesQ = query(collection(db, 'leaveRequests'), where('status', 'in', ['PENDING', 'APPROVED']));
    const leavesSnap = await getDocs(leavesQ);
    const allLeaves = leavesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    const staffData = staffSnap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        user: { name: data.name || data.displayName, email: data.email },
        role: data.role,
        shifts: allShifts.filter(s => s.staffId === docSnap.id),
        leaveRequests: allLeaves.filter(l => l.staffId === docSnap.id),
      };
    });

    return NextResponse.json(staffData);
  } catch (error) {
    console.error('Fetch staff error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff data' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shifts } = await req.json();

    const batch = writeBatch(db);

    shifts.forEach((s: any) => {
      let shiftRef;
      if (s.id) {
        shiftRef = doc(db, 'shifts', s.id);
      } else {
        shiftRef = doc(collection(db, 'shifts'));
      }
      batch.set(shiftRef, {
        staffId: s.staffId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        type: s.type || 'REGULAR',
      }, { merge: true });
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update shifts error:', error);
    return NextResponse.json({ error: 'Failed to update shifts' }, { status: 500 });
  }
}
