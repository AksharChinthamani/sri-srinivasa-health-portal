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

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const q1 = await adminDb.collection('messages')
      .where('senderId', '==', user.id)
      .where('receiverId', '==', otherUserId)
      .get();
      
    const q2 = await adminDb.collection('messages')
      .where('senderId', '==', otherUserId)
      .where('receiverId', '==', user.id)
      .get();
      
    let messages = [
      ...q1.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      ...q2.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    ];
    
    messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'receiverId and content are required' }, { status: 400 });
    }

    const docRef = adminDb.collection('messages').doc();
    const message = {
      id: docRef.id,
      senderId: user.id,
      receiverId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(message);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
