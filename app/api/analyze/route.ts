import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text, mode, detail } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: 'متن خالی است.' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY روی سرور تنظیم نشده.' }, { status: 500 });

    const client = new OpenAI({ apiKey });
    const count = detail === 'low' ? '3-5' : detail === 'high' ? '8-14' : detail === 'insane' ? '15-25' : '5-9';
    const prompt = mode === 'search'
      ? `The user wrote this Persian sound-effect request: ${text}\nUnderstand the intended sound, not just a literal translation. Return exactly one useful English SFX search query. Also give a short Persian title and category.`
      : `The user described a film scene in Persian: ${text}\nUnderstand the scene semantically. Break it into ${count} distinct sound effects that a filmmaker/editor could search for in an SFX library. Include ambience, room tone, foley, footsteps, doors, impacts, weather, movement, or other sounds only when they actually make sense in the scene. Do not invent unnecessary sounds. Preserve the scene's meaning. Each query must be natural English used in SFX libraries.`;

    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You are SFXR, an expert cinematic sound designer. Understand Persian naturally. Return JSON only in this shape: {"results":[{"title":"Persian short description","query":"English SFX search query","category":"one of AMBIENCE, FOLEY, FOOTSTEPS, DOOR, IMPACT, WEATHER, ROOM TONE, VEHICLE, NATURE, HUMAN, OTHER"}]}. Keep queries concise and searchable. ${mode === 'search' ? 'Return one result only.' : ''}` },
        { role: 'user', content: prompt }
      ],
    });

    const raw = response.choices[0]?.message?.content || '{"results":[]}';
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'تحلیل انجام نشد. API key یا تنظیمات مدل را بررسی کن.' }, { status: 500 });
  }
}
