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

    let chatUsers: any[] = [];
    const uniqueUserIds = new Set<string>();

    const q1 = await adminDb.collection('messages').where('senderId', '==', user.id).get();
    const q2 = await adminDb.collection('messages').where('receiverId', '==', user.id).get();

    q1.docs.forEach((doc: any) => uniqueUserIds.add(doc.data().receiverId));
    q2.docs.forEach((doc: any) => uniqueUserIds.add(doc.data().senderId));

    if (user.role === 'PATIENT') {
      const pharmSnap = await adminDb.collection('users').where('role', '==', 'PHARMACIST').limit(1).get();
      if (!pharmSnap.empty) {
        uniqueUserIds.add(pharmSnap.docs[0].id);
      }
    }
    
    // Fetch users
    if (uniqueUserIds.size > 0) {
      const idsArray = Array.from(uniqueUserIds);
      const userDocs: any[] = [];
      for (let i = 0; i < idsArray.length; i += 10) {
        const chunk = idsArray.slice(i, i + 10);
        const refs = chunk.map(id => adminDb.collection('users').doc(id));
        const docs = await adminDb.getAll(...refs);
        docs.forEach((d: any) => { if (d.exists) userDocs.push({ id: d.id, ...d.data() }); });
      }
      chatUsers = userDocs;
    }

    // Append unread count and last message
    const conversations = await Promise.all(chatUsers.map(async (u) => {
      const l1 = await adminDb.collection('messages')
        .where('senderId', '==', user.id).where('receiverId', '==', u.id)
        .get();
      const l2 = await adminDb.collection('messages')
        .where('senderId', '==', u.id).where('receiverId', '==', user.id)
        .get();
        
      const allMsgs = [...l1.docs.map((d: any) => d.data()), ...l2.docs.map((d: any) => d.data())];
      allMsgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const lastMessage = allMsgs.length > 0 ? allMsgs[0] : null;
      const unreadCount = allMsgs.filter(m => m.senderId === u.id && m.receiverId === user.id && !m.isRead).length;

      return {
        id: u.id,
        name: u.name || u.displayName || 'User',
        role: u.role || 'USER',
        avatar: u.avatar || (u.role === 'PHARMACIST' ? '💊' : '👨'),
        lastMessage: lastMessage ? lastMessage.content : 'Start a conversation',
        time: lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unread: unreadCount,
      };
    }));

    conversations.sort((a, b) => {
      if (a.unread > 0 && b.unread === 0) return -1;
      if (b.unread > 0 && a.unread === 0) return 1;
      return 0;
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Fetch chat users error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat users' }, { status: 500 });
  }
}
