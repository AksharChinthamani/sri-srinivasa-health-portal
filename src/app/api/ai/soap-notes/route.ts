export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { transcript, patientInfo } = await req.json();

    const prompt = `
You are a medical scribe. Based on the following consultation transcript, generate a structured SOAP note.
Patient: ${JSON.stringify(patientInfo)}
Transcript: ${transcript}

Output format:
**Subjective:** (patient's reported symptoms)
**Objective:** (observations, vitals if mentioned)
**Assessment:** (diagnosis or working diagnosis)
**Plan:** (next steps, prescriptions, referrals)

Return the SOAP note in plain text with clear headings.
    `;

    const gemini = getGeminiModel('gemini-1.5-flash');
    const result = await gemini.generateContent(prompt);
    return NextResponse.json({ soapNote: result.response.text() });
  } catch (error) {
    console.error('SOAP Note generation error:', error);
    return NextResponse.json({ error: 'Failed to generate SOAP notes' }, { status: 500 });
  }
}
