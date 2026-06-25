export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';
import { INVENTORY_THRESHOLDS } from '@/lib/utils/constants';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !['ADMIN', 'PHARMACIST'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Pending orders count
    const pendingOrdersSnap = await adminDb.collection('orders').where('status', 'in', ['pending', 'processing']).count().get();
    const pendingOrders = pendingOrdersSnap.data().count;

    // 2. Active prescriptions count
    const activePrescriptionsSnap = await adminDb.collection('prescriptions').where('status', '==', 'active').count().get();
    const activePrescriptions = activePrescriptionsSnap.data().count;

    // 3. Low stock count (fetch all active medicines and count in memory to avoid composite index limits)
    const medicinesSnap = await adminDb.collection('medicines').where('active', '==', true).get();
    let lowStockCount = 0;
    medicinesSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      if (data.stock <= INVENTORY_THRESHOLDS.LOW_STOCK && data.stock > 0) {
        if (!data.expiryDate || new Date(data.expiryDate) > new Date()) {
          lowStockCount++;
        }
      }
    });

    // 4. Total revenue & Recent orders (fetch 50 recent to calculate revenue, return top 5)
    // Note: A true total revenue would require a full table scan or a Cloud Function trigger maintaining a counter.
    // For this migration, we'll approximate recent revenue or fetch all orders if collection is small.
    // Given the migration context, we'll fetch all non-cancelled orders to sum.
    const allOrdersSnap = await adminDb.collection('orders').get();
    let totalRevenue = 0;
    const allOrders = allOrdersSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() as any }));
    
    const validOrders = allOrders.filter((o: any) => o.status !== 'cancelled');
    validOrders.forEach((o: any) => { totalRevenue += (o.total || 0); });

    // Sort by createdAt descending
    validOrders.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    const recentOrders = validOrders.slice(0, 5).map((order: any) => {
      let createdAtIso = new Date().toISOString();
      if (order.createdAt) {
        if (typeof order.createdAt.toDate === 'function') {
          createdAtIso = order.createdAt.toDate().toISOString();
        } else if (typeof order.createdAt === 'string') {
          createdAtIso = new Date(order.createdAt).toISOString();
        } else if (order.createdAt._seconds) {
          createdAtIso = new Date(order.createdAt._seconds * 1000).toISOString();
        } else if (order.createdAt.seconds) {
          createdAtIso = new Date(order.createdAt.seconds * 1000).toISOString();
        }
      }
      return {
        ...order,
        createdAt: createdAtIso,
      };
    });

    return NextResponse.json({
      stats: {
        pendingOrders,
        lowStockCount,
        activePrescriptions,
        totalRevenue,
      },
      recentOrders,
    });
  } catch (error: any) {
    console.error('Pharmacy dashboard API error:', error);
    if (error.code === 'not-found' || error.code === 5 || error.message?.includes('NOT_FOUND')) {
      return NextResponse.json({
        stats: {
          pendingOrders: 0,
          lowStockCount: 0,
          activePrescriptions: 0,
          totalRevenue: 0,
        },
        recentOrders: [],
      });
    }
    return NextResponse.json({ error: 'Failed to fetch pharmacy dashboard data' }, { status: 500 });
  }
}
