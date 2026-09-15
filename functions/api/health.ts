interface HealthContext { env: { OPENROUTER_API_KEY?: string } }

export function onRequestGet(context: HealthContext) {
  return new Response(JSON.stringify({
    ok: true,
    apiKeyConfigured: Boolean(context.env.OPENROUTER_API_KEY),
  }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
