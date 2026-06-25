export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, getCountFromServer, orderBy } from 'firebase/firestore';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;

    let q = collection(db, 'orders') as any;
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    // Total count
    const countSnap = await getCountFromServer(q);
    const total = countSnap.data().count;

    // Fetch all for pagination (simplification, since Firestore offset/limit pagination requires cursors)
    const ordersSnap = await getDocs(query(q, orderBy('createdAt', 'desc')));
    const allOrders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // In-memory pagination
    const startIdx = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(startIdx, startIdx + limit);

    return NextResponse.json({ orders: paginatedOrders, total, page, limit });
  } catch (error) {
    console.error('Fetch admin orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin orders' }, { status: 500 });
  }
}
