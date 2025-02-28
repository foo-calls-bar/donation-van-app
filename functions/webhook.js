export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('❌ No Stripe signature found.');
    return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), { status: 400 });
  }

  let rawBody;
  try {
    rawBody = await request.arrayBuffer(); // Required to prevent request modification by Cloudflare
  } catch (err) {
    console.error('❌ Error reading request body:', err);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
  }

  // Verify Stripe Webhook signature by calling Stripe API
  const stripeVerificationResponse = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Stripe-Signature': sig,
      'Content-Type': 'application/json'
    },
    body: rawBody
  });

  if (!stripeVerificationResponse.ok) {
    console.error('❌ Stripe Webhook Verification Failed');
    return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(new TextDecoder().decode(rawBody)); // Convert ArrayBuffer to String JSON
  } catch (err) {
    console.error('❌ Failed to parse JSON:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid JSON format' }), { status: 400 });
  }

  // ✅ Process payment event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amount = session.amount_total / 100; // Convert from cents

    let currentTotal = await env.DONATION_KV.get('total');
    currentTotal = Number(currentTotal) || 0;

    const newTotal = currentTotal + amount;
    await env.DONATION_KV.put('total', String(newTotal));

    console.log(`✅ Donation updated: $${amount} added. New total: $${newTotal}`);
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}
