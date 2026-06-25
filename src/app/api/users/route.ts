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
    const search = searchParams.get('q')?.toLowerCase() || '';

    const snapshot = await adminDb.collection('users').limit(100).get();
    
    let users = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() } as any))
      .filter((u: any) => u.id !== user.id);

    if (search) {
      users = users.filter((u: any) => 
        (u.name || '').toLowerCase().includes(search) || 
        (u.email || '').toLowerCase().includes(search) ||
        (u.role || '').toLowerCase().includes(search)
      );
    }
    
    const mapped = users.slice(0, 20).map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar || null,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
