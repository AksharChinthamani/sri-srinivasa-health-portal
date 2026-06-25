import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';

    let q = query(
      collection(db, 'medicines'),
      where('active', '==', true)
    );

    if (category) {
      q = query(q, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    let medicines = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      
      const formatTimestamp = (ts: any) => {
        if (!ts) return null;
        if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
        if (typeof ts === 'string') return new Date(ts).toISOString();
        if (ts._seconds) return new Date(ts._seconds * 1000).toISOString();
        if (ts.seconds) return new Date(ts.seconds * 1000).toISOString();
        return new Date().toISOString();
      };

      return {
        id: docSnap.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
        expiryDate: formatTimestamp(data.expiryDate),
      };
    }) as any[];

    // In-memory text search fallback since Firestore lacks native full-text search
    if (search) {
      medicines = medicines.filter(med => 
        med.name?.toLowerCase().includes(search) || 
        med.category?.toLowerCase().includes(search)
      );
    }

    // Sort by name in memory
    medicines.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Add stock status field (derived)
    const withStatus = medicines.map((med: any) => ({
      ...med,
      stockStatus: med.stock > 20 ? 'In Stock' : med.stock > 0 ? 'Low' : 'Out of Stock',
    }));

    return NextResponse.json(withStatus);
  } catch (error) {
    console.error('Fetch medicines error:', error);
    return NextResponse.json({ error: 'Failed to fetch medicines' }, { status: 500 });
  }
}
