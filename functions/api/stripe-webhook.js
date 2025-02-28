export async function onRequestPost({ env, request }) {
  // Read the raw request body (in production, verify the Stripe signature!)
  const payload = await request.text();
  
  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    return new Response('Invalid payload', { status: 400 });
  }

  // Handle the checkout session completed event from Stripe
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Stripe returns amount_total in cents
    const amount = session.amount_total;
    // Retrieve the current donation total from KV (or 0 if not set)
    const currentTotal = parseInt(await env.DONATIONS.get('total') || "0");
    const newTotal = currentTotal + amount;
    await env.DONATIONS.put('total', newTotal.toString());
  }
  
  return new Response('Webhook received', { status: 200 });
}
