import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';
import { INVENTORY_THRESHOLDS } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Aggregations using Firestore

    // Revenue today (fetch today's orders)
    const todayOrdersSnap = await adminDb.collection('orders')
      .where('status', 'in', ['pending', 'processing', 'shipped', 'delivered'])
      .get();
    let totalRevenueToday = 0;
    todayOrdersSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      let dateStr = '';
      if (typeof data.createdAt === 'string') {
        dateStr = data.createdAt;
      } else if (data.createdAt?.toDate) {
        dateStr = data.createdAt.toDate().toISOString();
      }
      if (dateStr.startsWith(todayStr)) {
        totalRevenueToday += data.total || 0;
      }
    });

    // Active patients (simply count users with role = patient for now)
    const activePatientsSnap = await adminDb.collection('users').where('role', '==', 'PATIENT').count().get();
    const activePatients = activePatientsSnap.data().count;

    // Appointments today
    const appointmentsTodaySnap = await adminDb.collection('appointments').where('date', '==', todayStr).count().get();
    const appointmentsToday = appointmentsTodaySnap.data().count;

    // Pending orders count
    const pendingOrdersSnap = await adminDb.collection('orders').where('status', '==', 'pending').count().get();
    const pendingOrders = pendingOrdersSnap.data().count;

    // Medicines aggregations (fetch all active and aggregate in memory to save composite indexes)
    const medicinesSnap = await adminDb.collection('medicines').where('active', '==', true).get();
    let expiringMedicines = 0;
    let lowStockMedicines = 0;
    const categoriesCount: Record<string, number> = {};

    const expiryThreshold = new Date(Date.now() + INVENTORY_THRESHOLDS.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    medicinesSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      
      if (data.stock <= INVENTORY_THRESHOLDS.LOW_STOCK && data.stock > 0) {
        lowStockMedicines++;
      }

      if (data.expiryDate) {
        const expDate = new Date(data.expiryDate);
        if (expDate < expiryThreshold && expDate > new Date() && data.stock > 0) {
          expiringMedicines++;
        }
      }

      const cat = data.category || 'Other';
      categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    });

    const medicineCategories = Object.entries(categoriesCount).map(([category, count]) => ({ category, _count: count }));

    // Revenue by month & Appointments by day (Mocking past data structure for UI)
    return NextResponse.json({
      stats: {
        revenueToday: totalRevenueToday,
        activePatients,
        appointmentsToday,
        expiringMedicines,
        lowStockMedicines,
        pendingOrders,
      },
      revenueLast12Months: [], // Simplification for migration
      appointmentsLast7Days: [], // Simplification for migration
      medicineCategories,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    // If Firestore database is not initialized yet, return empty stats
    if (error.code === 'not-found' || error.code === 5 || error.message?.includes('NOT_FOUND')) {
      return NextResponse.json({
        stats: {
          revenueToday: 0,
          activePatients: 0,
          appointmentsToday: 0,
          expiringMedicines: 0,
          lowStockMedicines: 0,
          pendingOrders: 0,
        },
        revenueLast12Months: [],
        appointmentsLast7Days: [],
        medicineCategories: [],
      });
    }
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
