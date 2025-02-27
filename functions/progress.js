export async function onRequest(context) {
  const { env } = context;
  let currentTotal = await env.DONATION_KV.get('total');
  currentTotal = Number(currentTotal) || 0;

  return new Response(JSON.stringify({ total: currentTotal }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
