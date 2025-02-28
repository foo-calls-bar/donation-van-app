import { createHmac, timingSafeEqual } from 'crypto';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET;

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    console.error('❌ No Stripe signature header found.');
    return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), { status: 400 });
  }

  let payload;
  try {
    // Cloudflare modifies request bodies, so we must use `request.arrayBuffer()`
    const rawBody = await request.arrayBuffer();
    payload = new TextDecoder().decode(rawBody);

    // Create HMAC SHA-256 signature for verification
    const hmac = createHmac('sha256', stripeWebhookSecret);
    hmac.update(payload);
    const computedSignature = `t=${Date.now()},v1=${hmac.digest('hex')}`;

    // Compare signatures securely
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(computedSignature))) {
      throw new Error('Invalid signature');
    }

  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    console.error('❌ Failed to parse JSON:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid JSON format' }), { status: 400 });
  }

  // ✅ Process payment event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amount = session.amount_total / 100;

    let currentTotal = await env.DONATION_KV.get('total');
    currentTotal = Number(currentTotal) || 0;

    const newTotal = currentTotal + amount;
    await env.DONATION_KV.put('total', String(newTotal));

    console.log(`✅ Donation updated: $${amount} added. New total: $${newTotal}`);
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}
