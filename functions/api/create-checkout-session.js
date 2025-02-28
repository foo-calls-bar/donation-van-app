export async function onRequestPost({ env, request }) {
  const stripeSecretKey = env.STRIPE_SECRET_KEY;
  const DOMAIN = env.DOMAIN || 'https://donate.kaiserhouse.net';

  // For a simple demo, we use a fixed donation amount (in cents).
  // You can modify this to allow variable amounts.
  const donationAmount = 5000; // $50.00 donation

  const params = new URLSearchParams();
  params.append('payment_method_types[]', 'card');
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][product_data][name]', 'Donation for Wheelchair-Accessible Van');
  params.append('line_items[0][price_data][unit_amount]', donationAmount.toString());
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
