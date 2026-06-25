export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { items, deliveryAddress, isPrescription, prescriptionId, paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!deliveryAddress) {
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 });
    }

    let total = 0;
    const orderItems: any[] = [];
    const batch = writeBatch(db);
    
    // Fetch all active medicines to match names for prescription items
    const allMedsSnap = await adminDb.collection('medicines').where('active', '==', true).get();
    const allMeds = allMedsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() as any }));

    for (const item of items) {
      if (isPrescription) {
        const itemName = item.medicineName || item.name || '';
        const normalizedName = itemName.toLowerCase().trim();
        
        // Try to find a matching medicine in the catalog by name
        // (Simple exact match ignoring case. A more advanced system would use fuzzy search)
        const matchedMed = allMeds.find((m: any) => (m.name || '').toLowerCase().trim() === normalizedName);
        
        const price = matchedMed ? matchedMed.price : 0;
        const qty = item.quantity || 1;
        total += (price * qty);

        orderItems.push({
          name: itemName,
          medicineId: matchedMed ? matchedMed.id : null,
          quantity: qty,
          dosage: item.dosage || '',
          duration: item.duration || '',
          price: price,
        });
      } else {
        const medRef = doc(db, 'medicines', item.medicineId);
        const medSnap = await getDoc(medRef);
        
        if (!medSnap.exists()) {
          return NextResponse.json({ error: `Medicine ${item.medicineId} not found` }, { status: 404 });
        }
        
        const medicine = medSnap.data();
        
        if (medicine.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${medicine.name || 'item'}` },
            { status: 400 }
          );
        }
        
        total += (medicine.price * item.quantity);
        orderItems.push({
          medicineId: medSnap.id,
          name: medicine.name,
          quantity: item.quantity,
          price: medicine.price,
        });

        // Add stock decrement to batch
        batch.update(medRef, { stock: medicine.stock - item.quantity });
      }
    }

    // Create order document
    const orderRef = doc(collection(db, 'orders'));
    const orderData = {
      patientId: user.id,
      total,
      deliveryAddress,
      status: 'pending',
      items: orderItems,
      isPrescription: isPrescription || false,
      prescriptionId: prescriptionId || null,
      paymentMethod: paymentMethod || 'cod',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    batch.set(orderRef, orderData);

    // Commit batch
    await batch.commit();

    return NextResponse.json({ order: { id: orderRef.id, ...orderData }, message: 'Order placed successfully' }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isStaff = user.role === 'PHARMACIST' || user.role === 'ADMIN';
    let snapshot;

    if (isStaff) {
      snapshot = await adminDb.collection('orders').get();
    } else {
      snapshot = await adminDb.collection('orders')
        .where('patientId', '==', user.id)
        .get();
    }

    const orders = snapshot.docs.map((docSnap: any) => {
      const data = docSnap.data();
      let createdAtIso = new Date().toISOString();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAtIso = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtIso = new Date(data.createdAt).toISOString();
        } else if (data.createdAt._seconds) {
          createdAtIso = new Date(data.createdAt._seconds * 1000).toISOString();
        } else if (data.createdAt.seconds) {
          createdAtIso = new Date(data.createdAt.seconds * 1000).toISOString();
        }
      }

      return {
        id: docSnap.id,
        ...data,
        createdAt: createdAtIso,
      };
    });

    // Sort by createdAt desc in memory to avoid composite index requirement
    orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();
    if (orderData?.patientId !== user.id && user.role === 'PATIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (orderData?.status !== 'pending' && status === 'cancelled') {
       return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
    }

    await orderRef.update({ 
      status, 
      updatedAt: new Date() 
    });

    return NextResponse.json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
