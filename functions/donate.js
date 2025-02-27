export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid donation amount.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Retrieve current total from KV storage (default to 0 if not set)
    let currentTotal = await env.DONATION_KV.get('total');
    currentTotal = Number(currentTotal) || 0;

    // Update the total amount
    const newTotal = currentTotal + amount;
    await env.DONATION_KV.put('total', String(newTotal));

    return new Response(JSON.stringify({ total: newTotal }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error processing donation.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
