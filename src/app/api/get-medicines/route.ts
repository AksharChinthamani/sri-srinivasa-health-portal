import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('medicines').get();
    const medicines = snapshot.docs.map((doc: any) => ({ id: doc.id, name: doc.data().name }));
    return NextResponse.json({ medicines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
