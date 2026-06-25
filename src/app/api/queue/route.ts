import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, orderBy, getCountFromServer } from 'firebase/firestore';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const q = query(
      collection(db, 'queueTokens'),
      where('patientId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const tokens = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Fetch patient queue tokens error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { appointmentId } = body;

    // We can't strictly query "today" easily without exact timestamp index, 
    // so we will query all waiting/completed tokens created today using a date string field.
    const todayStr = new Date().toISOString().split('T')[0];

    const todayTokensQ = query(
      collection(db, 'queueTokens'),
      where('dateString', '==', todayStr)
    );
    const todaySnap = await getCountFromServer(todayTokensQ);
    const tokenNumber = todaySnap.data().count + 1;

    const tokenRef = doc(collection(db, 'queueTokens'));
    const tokenData = {
      patientId: user.id,
      tokenNumber,
      status: 'WAITING',
      appointmentId: appointmentId || null,
      dateString: todayStr,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(tokenRef, tokenData);

    return NextResponse.json({ success: true, token: { id: tokenRef.id, ...tokenData } });
  } catch (error) {
    console.error('Create queue token error:', error);
    return NextResponse.json({ error: 'Failed to generate queue token' }, { status: 500 });
  }
}
