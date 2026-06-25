export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch relevant data: upcoming appointments, recent orders, active prescriptions
    const [appointmentsSnap, ordersSnap, prescriptionsSnap] = await Promise.all([
      adminDb.collection('appointments')
        .where('patientId', '==', user.id)
        .where('status', 'in', ['PENDING', 'CONFIRMED'])
        .limit(3)
        .get(),
      adminDb.collection('orders')
        .where('userId', '==', user.id)
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get(),
      adminDb.collection('prescriptions')
        .where('patientId', '==', user.id)
        .where('status', '==', 'active')
        .limit(3)
        .get(),
    ]);

    const appointments = appointmentsSnap.docs.map(doc => doc.data());
    const orders = ordersSnap.docs.map(doc => doc.data());
    const prescriptions = prescriptionsSnap.docs.map(doc => doc.data());

    const prompt = `
You are a friendly health assistant. Based on the following patient data, generate a short, personalized health insight (1-2 sentences) that encourages the patient to take action or stay informed.

Patient:
- Upcoming appointments: ${appointments.length}
- Recent orders: ${orders.length}
- Active prescriptions: ${prescriptions.length} active.

Output: a single sentence that is encouraging and actionable, like "Your BP medication refill is due in 3 days." or "You have an appointment with Dr. Sharma tomorrow, don't forget!"

Be warm and supportive.
    `;

    const activeKey = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (!activeKey || activeKey.includes('fallback-secret') || activeKey.trim() === '') {
      throw new Error('No API key');
    }

    const gemini = getGeminiModel('gemini-1.5-flash');
    const result = await gemini.generateContent(prompt);
    const insight = result.response.text().trim();

    return NextResponse.json({ insight });
  } catch (error) {
    console.error('Insight generation error:', error);
    return NextResponse.json({ insight: 'Stay healthy and remember to drink plenty of water!' });
  }
}
