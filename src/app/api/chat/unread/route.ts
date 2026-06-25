export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await adminDb.collection('messages')
      .where('receiverId', '==', user.id)
      .where('isRead', '==', false)
      .count()
      .get();

    return NextResponse.json({ count: snapshot.data().count });
  } catch (error: any) {
    console.error('Fetch unread messages error:', error);
    if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      return NextResponse.json({ count: 0 });
    }
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
