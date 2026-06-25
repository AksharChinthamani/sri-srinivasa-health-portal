export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const q = query(
      collection(db, 'queueTokens'),
      where('status', 'in', ['WAITING', 'CALLED']),
      orderBy('tokenNumber', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const tokens = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    // In a real migration, we'd also join with users collection to get patient names.
    // For simplicity, we assume token object contains patient name or frontend resolves it.
    
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Fetch queue error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}
