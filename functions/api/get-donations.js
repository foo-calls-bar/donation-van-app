export async function onRequestGet({ env }) {
  // Get the current donation total from KV (default to "0" if not set)
  const total = await env.DONATIONS.get('total') || "0";
  return new Response(JSON.stringify({ total: parseInt(total) }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
