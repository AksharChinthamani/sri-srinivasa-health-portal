export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getUserFromRequest } from '@/lib/auth';
import { INVENTORY_THRESHOLDS } from '@/lib/utils/constants';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !['ADMIN', 'PHARMACIST'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const filter = searchParams.get('filter') || 'all';

    let q = collection(db, 'medicines') as any;

    if (category && category !== 'All Categories') {
      q = query(q, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    let medicines = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as any)
    })) as any[];

    // In-memory filtering for search and complex threshold logic
    if (search) {
      medicines = medicines.filter(m => 
        m.name?.toLowerCase().includes(search) || 
        m.category?.toLowerCase().includes(search)
      );
    }

    if (filter === 'low') {
      medicines = medicines.filter(m => m.stock <= INVENTORY_THRESHOLDS.LOW_STOCK);
    } else if (filter === 'expiring') {
      const soon = new Date();
      soon.setDate(soon.getDate() + INVENTORY_THRESHOLDS.EXPIRY_DAYS);
      medicines = medicines.filter(m => m.expiryDate && new Date(m.expiryDate) <= soon);
    }

    // Sort by name
    medicines.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return NextResponse.json(medicines);
  } catch (error) {
    console.error('Fetch inventory error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !['ADMIN', 'PHARMACIST'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, dosage, category, price, stock, expiryDate, imageUrl } = body;

    if (!name) {
      return NextResponse.json({ error: 'Medicine name is required' }, { status: 400 });
    }

    const newMedRef = doc(collection(db, 'medicines'));
    const medicineData = {
      name,
      dosage: dosage || 'Standard',
      category: category || 'General',
      price: price !== undefined ? Number(price) : 0.0,
      stock: stock !== undefined ? Number(stock) : 0,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : new Date().toISOString(),
      imageUrl: imageUrl || '',
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newMedRef, medicineData);

    return NextResponse.json({ id: newMedRef.id, ...medicineData });
  } catch (error) {
    console.error('Create medicine error:', error);
    return NextResponse.json({ error: 'Failed to create medicine' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !['ADMIN', 'PHARMACIST'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, dosage, category, price, stock, expiryDate, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: any = { updatedAt: serverTimestamp() };
    if (name !== undefined) updateData.name = name;
    if (dosage !== undefined) updateData.dosage = dosage;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate).toISOString();
    if (active !== undefined) updateData.active = Boolean(active);

    const medRef = doc(db, 'medicines', id);
    await updateDoc(medRef, updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update medicine error:', error);
    return NextResponse.json({ error: 'Failed to update medicine' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !['ADMIN', 'PHARMACIST'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    try {
      const medRef = doc(db, 'medicines', id);
      await deleteDoc(medRef);
      return NextResponse.json({ success: true, message: 'Medicine deleted successfully' });
    } catch (dbError) {
      console.error('Delete medicine error:', dbError);
      return NextResponse.json({ error: 'Failed to delete medicine' }, { status: 500 });
    }
  } catch (error) {
    console.error('Delete medicine error:', error);
    return NextResponse.json({ error: 'Failed to delete medicine' }, { status: 500 });
  }
}
