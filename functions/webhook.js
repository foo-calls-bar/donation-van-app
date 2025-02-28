export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const payload = await request.text();
    const sig = request.headers.get('stripe-signature');

    // Verify the Stripe webhook signature
    const stripeResponse = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ payload, sig, stripeWebhookSecret })
    });

    if (!stripeResponse.ok) {
      throw new Error('Webhook verification failed.');
    }

    event = await stripeResponse.json();
  } catch (err) {
    console.error('Webhook error:', err.message);
    return new Response(JSON.stringify({ error: 'Webhook signature verification failed.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Process the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const amount = session.amount_total / 100; // Convert from cents

    // Retrieve the current total from KV
    let currentTotal = await env.DONATION_KV.get('total');
    currentTotal = Number(currentTotal) || 0;

    // Update KV with the new total
    const newTotal = currentTotal + amount;
    await env.DONATION_KV.put('total', String(newTotal));

    console.log(`✅ Donation updated: $${amount} added. New total: $${newTotal}`);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
