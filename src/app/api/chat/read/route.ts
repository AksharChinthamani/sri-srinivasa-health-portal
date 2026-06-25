export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { senderId } = body;

    if (!senderId) {
      return NextResponse.json({ error: 'senderId is required' }, { status: 400 });
    }

    const snapshot = await adminDb.collection('messages')
      .where('senderId', '==', senderId)
      .where('receiverId', '==', user.id)
      .where('isRead', '==', false)
      .get();

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc: any) => {
      batch.update(doc.ref, { isRead: true });
    });
    
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark messages read error:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
