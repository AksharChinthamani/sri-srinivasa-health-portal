import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const q = query(
      collection(db, 'medicines'),
      where('active', '==', true)
    );
    const snapshot = await getDocs(q);
    
    const categorySet = new Set<string>();
    snapshot.docs.forEach(docSnap => {
      const category = docSnap.data().category;
      if (category) {
        categorySet.add(category);
      }
    });

    const categories = Array.from(categorySet);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
