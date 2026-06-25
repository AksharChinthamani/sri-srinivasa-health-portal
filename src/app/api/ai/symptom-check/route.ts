export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location, duration, severity, symptoms } = body;

    // Build a rich prompt for Gemini
    const prompt = `
You are a medical AI assistant. Analyze the following patient-reported symptoms and provide:
1. Urgency level: "Low", "Medium", or "High"
2. Suggested specialist (e.g., Cardiologist, Neurologist, General Physician, etc.)
3. Brief explanation of your reasoning (2-3 sentences).

Patient symptoms:
- Pain location: ${location}
- Duration: ${duration}
- Severity (1-10): ${severity}
- Additional symptoms: ${symptoms ? symptoms.join(', ') : 'None'}

Output format: Return valid JSON only, with keys: "urgency", "specialist", "reasoning".
    `;

    const gemini = getGeminiModel('gemini-1.5-flash');
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from Gemini response (Gemini may wrap with markdown)
    let jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }
    const data = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      urgency: data.urgency || 'Low',
      specialist: data.specialist || 'General Physician',
      reasoning: data.reasoning || 'Based on symptoms, consult a doctor.',
    });
  } catch (error) {
    console.error('Symptom Checker error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    );
  }
}
