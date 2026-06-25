export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { medicines } = await req.json(); // array of { name, dosage }

    if (!medicines || medicines.length < 2) {
      return NextResponse.json({ interactions: [] });
    }

    const medicineNames = medicines.map((m: any) => `${m.name} ${m.dosage || ''}`).join(', ');

    const prompt = `
You are a pharmacology expert. Given the following list of medicines, check for potential interactions.
Return a JSON array of interactions. Each interaction should have:
- "medicines": array of two medicine names involved.
- "severity": "Mild", "Moderate", or "Severe".
- "description": a brief description of the interaction.
- "recommendation": advice for the patient.

Medicines: ${medicineNames}

If no significant interactions found, return an empty array.

Output format: valid JSON only, e.g., [{"medicines":["A","B"],"severity":"Moderate","description":"...","recommendation":"..."}]
    `;

    const gemini = getGeminiModel('gemini-1.5-flash');
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();

    let interactions = [];
    try {
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        interactions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse interactions:', e);
    }

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Drug interaction check error:', error);
    return NextResponse.json({ error: 'Failed to check interactions' }, { status: 500 });
  }
}
