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

    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': 'Wheelchair-Accessible Van Donation',
        'line_items[0][price_data][unit_amount]': Math.round(amount * 100), 
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': 'https://donate.kaiserhouse.net/success',
        'cancel_url': 'https://donate.kaiserhouse.net',
        'metadata[amount]': amount
      })
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe API Error:", session);
      return new Response(JSON.stringify({ error: session.error?.message || 'Error creating payment session.' }), {
        status: stripeResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Payment Processing Error:", error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred while processing payment.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
