import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getUserFromRequest } from '@/lib/auth';
import { generateGeminiResponse } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    let appointments: any[] = [];
    let prescriptions: any[] = [];
    let orders: any[] = [];

    // 1. Fetch upcoming appointments
    try {
      const appointmentsSnap = await adminDb.collection('appointments')
        .where('patientId', '==', user.id)
        .where('status', 'in', ['PENDING', 'CONFIRMED'])
        .get();
        
      appointments = await Promise.all(appointmentsSnap.docs.map(async (doc: any) => {
        const app = { id: doc.id, ...doc.data() };
        if (app.doctorId) {
          const docUserSnap = await adminDb.collection('users').doc(app.doctorId).get();
          app.doctor = { user: { name: docUserSnap.data()?.name || 'Doctor' }, specialty: app.specialty || 'General' };
        }
        return app;
      }));
    } catch(e) { console.error('Appointments fetch error', e); }

    // 2. Fetch active prescriptions
    try {
      const prescriptionsSnap = await adminDb.collection('prescriptions')
        .where('patientId', '==', user.id)
        .where('status', '==', 'active')
        .get();
        
      prescriptions = await Promise.all(prescriptionsSnap.docs.map(async (doc: any) => {
        const p = { id: doc.id, ...doc.data() };
        if (p.doctorId) {
          const docUserSnap = await adminDb.collection('users').doc(p.doctorId).get();
          p.doctor = { user: { name: docUserSnap.data()?.name || 'Doctor' } };
        }
        return p;
      }));
    } catch(e) { console.error('Prescriptions fetch error', e); }

    // 3. Fetch recent orders
    try {
      const ordersSnap = await adminDb.collection('orders')
        .where('userId', '==', user.id)
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get();
      orders = ordersSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() as any }));
    } catch(e) { console.error('Orders fetch error', e); }

    // Construct Context Prompt
    const contextPrompt = `
You are a helpful AI Health Assistant for the Sri Srinivasa Health Portal.
Here is the current logged-in patient's real data from the database. Use this data directly to answer questions accurately and specifically without inventing details:
- Patient Name: ${user.name}
- Current Date/Time: ${new Date().toLocaleString()}

Upcoming Appointments:
${appointments.length === 0 ? 'None scheduled.' : appointments.map(a => `- Appointment with ${a.doctor?.user?.name} on ${a.date} at ${a.time} (Status: ${a.status})`).join('\n')}

Active Prescriptions:
${prescriptions.length === 0 ? 'None active.' : prescriptions.map(p => `- Issued by ${p.doctor?.user?.name} on ${p.issuedAt || new Date().toISOString().split('T')[0]}. Medicines:\n${p.medicines?.map((m: any) => `  * ${m.medicineName || m.name} - ${m.dosage}, ${m.frequency} for ${m.duration} (${m.instructions || ''})`).join('\n')}`).join('\n')}

Recent Orders:
${orders.length === 0 ? 'No orders.' : orders.map(o => `- Order ID: #${o.id.slice(-8).toUpperCase()}, Total: ₹${o.totalAmount?.toFixed(2) || 0}, Status: ${o.status}, Date: ${o.createdAt?.toDate ? o.createdAt.toDate().toISOString().split('T')[0] : (o.createdAt || 'Recent')}`).join('\n')}

Rules:
1. Always base answers on the real database data provided above. If they ask "when is my next appointment?", check the "Upcoming Appointments" section above and give the exact doctor, date, and time.
2. If they do not have an upcoming appointment or prescription, state that they don't have any, and guide them on how they can book an appointment or order medicines in the portal.
3. Be professional, polite, concise, and clinically helpful.
4. Keep formatting clean and readable using standard Markdown.
5. If the request requires Gemini API keys and they are missing or if the API call fails, provide a friendly, helpful fallback message that retrieves the direct data for them.

User Question: ${message}
`;

    let reply = '';
    const activeKey = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;

    if (activeKey && !activeKey.includes('fallback-secret') && activeKey.trim() !== '') {
      try {
        reply = await generateGeminiResponse(contextPrompt);
      } catch (geminiError) {
        console.warn('Gemini response error, using fallback matching logic:', geminiError);
      }
    }

    // Fallback template logic if AI is offline or keys are not available
    if (!reply) {
      const q = message.toLowerCase();
      if (q.includes('appointment')) {
        if (appointments.length > 0) {
          const first = appointments[0];
          reply = `According to your portal records, your next appointment is scheduled with **${first.doctor?.user?.name}** on **${first.date}** at **${first.time}** (Status: **${first.status}**).`;
        } else {
          reply = `I checked your records and found no upcoming appointments scheduled. If you would like to book an appointment with one of our doctors, please head over to the **Book Appointment** page from your dashboard.`;
        }
      } else if (q.includes('prescription')) {
        if (prescriptions.length > 0) {
          const detailsList = prescriptions.flatMap(p => 
            (p.medicines || []).map((m: any) => `- **${m.medicineName || m.name}** (${m.dosage}) - ${m.frequency} for ${m.duration} (Prescribed by ${p.doctor?.user?.name})`)
          ).join('\n');
          reply = `You have active prescriptions on file:\n\n${detailsList}`;
        } else {
          reply = `You currently have no active prescriptions on file. If you need a refill or a new prescription, you can schedule a consult with a doctor.`;
        }
      } else if (q.includes('order')) {
        if (orders.length > 0) {
          const orderList = orders.map(o => 
            `- **Order #${o.id.slice(-8).toUpperCase()}**: ₹${o.totalAmount?.toFixed(2) || 0} status is **${o.status}** (Placed on ${o.createdAt?.toDate ? o.createdAt.toDate().toISOString().split('T')[0] : (o.createdAt || 'Recent')})`
          ).join('\n');
          reply = `Here are your recent pharmacy orders:\n\n${orderList}`;
        } else {
          reply = `You haven't placed any pharmacy orders yet.`;
        }
      } else {
        reply = `Hello, ${user.name}! I am currently running in portal-connected database fallback mode. I can query your health records directly!

How can I help you today? You can ask me:
- **"When is my next appointment?"**
- **"Show my prescriptions"**
- **"Track my orders"**`;
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chatbot endpoint error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
