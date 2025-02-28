export async function onRequestPost({ env, request }) {
  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const DOMAIN = env.DOMAIN || 'https://donate.kaiserhouse.net';

  // Read and parse the JSON payload from the request
  let donationAmount;
  try {
    const body = await request.json();
    donationAmount = parseFloat(body.donationAmount);
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  // Validate that the donation amount is at least $1
  if (isNaN(donationAmount) || donationAmount < 1) {
    return new Response(JSON.stringify({ error: "Donation amount must be at least $1" }), { status: 400 });
  }

  // Convert donation amount in dollars to cents (Stripe expects cents)
  const donationAmountCents = Math.round(donationAmount * 100);

  const params = new URLSearchParams();
  params.append('payment_method_types[]', 'card');
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][product_data][name]', 'Donation for Wheelchair-Accessible Van');
  params.append('line_items[0][price_data][unit_amount]', donationAmountCents.toString());
  params.append('line_items[0][quantity]', '1');
  params.append('mode', 'payment');
  params.append('success_url', `${DOMAIN}/success.html`);
  params.append('cancel_url', `${DOMAIN}/cancel.html`);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + stripeSecretKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  const session = await response.json();

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
