export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(_req: NextRequest) {
  try {
    let formattedData: any[] = [];
    try {
      const ordersSnap = await adminDb.collection('orders')
        .where('status', 'not-in', ['CANCELLED'])
        .get();

      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

      const byMonth: Record<string, number> = {};
      for (const doc of ordersSnap.docs) {
        const o = doc.data();
        let createdAt = new Date();
        if (o.createdAt?.toDate) {
            createdAt = o.createdAt.toDate();
        } else if (typeof o.createdAt === 'string') {
            createdAt = new Date(o.createdAt);
        }
        
        if (createdAt >= oneYearAgo) {
            const month = createdAt.toISOString().substring(0, 7);
            byMonth[month] = (byMonth[month] || 0) + (o.totalAmount || o.total || 0);
        }
      }
      formattedData = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({ month, revenue }));
    } catch(_e) {
      console.warn('Orders fetch error', _e);
    }

    const prompt = `
You are a financial analyst. Here is the monthly revenue data for a medical store over the last 12 months:
${JSON.stringify(formattedData, null, 2)}

Predict the revenue for the next 30 days. Provide:
- "forecast": a number (average daily revenue for the next 30 days).
- "confidence": "High", "Medium", or "Low".
- "explanation": brief explanation of trends.

Return valid JSON only with keys: "forecast", "confidence", "explanation".
    `;

    const activeKey = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (!activeKey || activeKey.includes('fallback-secret') || activeKey.trim() === '') {
      throw new Error('No API key');
    }

    const gemini = getGeminiModel('gemini-1.5-flash');
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error('Could not parse forecast');

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json({ forecast: 0, confidence: 'Low', explanation: 'Failed to generate forecast due to an error.' });
  }
}
