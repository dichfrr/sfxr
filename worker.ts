export interface Env {
  ASSETS: Fetcher;
  OPENROUTER_API_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });
}

function cleanJson(content: unknown) {
  let value = typeof content === 'string' ? content.trim() : JSON.stringify(content);
  value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start >= 0 && end > start) value = value.slice(start, end + 1);
  return JSON.parse(value);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({ ok: true, apiKeyConfigured: Boolean(env.OPENROUTER_API_KEY) });
    }

    if (url.pathname === '/api/analyze') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
      if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

      try {
        const body = await request.json().catch(() => null) as {
          text?: string;
          mode?: 'scene' | 'search';
          detail?: 'low' | 'medium' | 'high' | 'insane';
        } | null;

        const text = body?.text?.trim();
        const mode = body?.mode === 'search' ? 'search' : 'scene';
        const detail = body?.detail || 'medium';

        if (!text) return json({ error: 'متن خالی است.' }, 400);
        if (!env.OPENROUTER_API_KEY) return json({ error: 'کلید OpenRouter روی Cloudflare تنظیم نشده است.' }, 500);

        const count = detail === 'low' ? '3-5' : detail === 'high' ? '8-14' : detail === 'insane' ? '15-25' : '5-9';

        const prompt = mode === 'search'
          ? `The user wrote this Persian SFX request: ${text}\nUnderstand the intended sound, not a literal translation. Return exactly one useful English search query for a professional sound-effects library.`
          : `The user described this film scene in Persian: ${text}\nUnderstand the scene semantically, not as a literal translation. Break it into ${count} distinct sound effects useful for a filmmaker/editor. Include ambience, room tone, foley, footsteps, doors, impacts, weather, movement, etc. only when justified by the scene. Do not invent unnecessary sounds. Each query must be natural concise English used in SFX libraries.`;

        const system = `You are SFXR, an expert cinematic sound designer who understands Persian naturally. Return ONLY valid JSON. Exact shape: {"results":[{"title":"Persian short description","query":"English SFX search query","category":"AMBIENCE|FOLEY|FOOTSTEPS|DOOR|IMPACT|WEATHER|ROOM TONE|VEHICLE|NATURE|HUMAN|OTHER"}]}. Keep queries concise and searchable. ${mode === 'search' ? 'Return exactly one result.' : ''}`;

        const ai = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://sfxr.pages.dev',
            'X-Title': 'SFXR',
          },
          body: JSON.stringify({
            model: 'openrouter/free',
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
          }),
        });

        const raw = await ai.text();
        if (!ai.ok) {
          let message = raw;
          try { message = JSON.parse(raw)?.error?.message || raw; } catch {}
          return json({ error: `هوش مصنوعی خطا داد: ${message}` }, 502);
        }

        let responseData: any;
        try { responseData = JSON.parse(raw); } catch { return json({ error: 'پاسخ OpenRouter قابل خواندن نبود.' }, 502); }
        const content = responseData?.choices?.[0]?.message?.content;
        if (!content) return json({ error: 'هوش مصنوعی پاسخ خالی برگرداند.' }, 502);

        try {
          return json(cleanJson(content));
        } catch {
          return json({ error: 'پاسخ SFXR از هوش مصنوعی JSON معتبر نبود.' }, 502);
        }
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : 'خطای داخلی سرور.' }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
