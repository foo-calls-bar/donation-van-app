// Helper function: Convert an ArrayBuffer to a hexadecimal string.
function arrayBufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify the Stripe signature using HMAC-SHA256.
async function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!signatureHeader) return false;

  // The header should look like: "t=timestamp,v1=signature[,v1=signature2,...]"
  const parts = signatureHeader.split(',');
  let timestamp;
  const signatures = [];
  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = value;
    } else if (key === 'v1') {
      signatures.push(value);
    }
  });
  if (!timestamp || signatures.length === 0) return false;

  // Create the signed payload string as "timestamp.payload"
  const encoder = new TextEncoder();
  const signedPayload = `${timestamp}.${payload}`;
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(signedPayload)
  );
  const expectedSignature = arrayBufferToHex(signatureBuffer);

  // Check if the computed signature matches any of the signatures provided
  return signatures.some(sig => sig === expectedSignature);
}

export async function onRequestPost({ env, request }) {
  // Retrieve the raw request payload.
  const payload = await request.text();

  // Extract the Stripe signature from the headers.
  const stripeSignature = request.headers.get('stripe-signature');
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  // If a webhook secret is provided, verify the signature.
  if (webhookSecret) {
    const isValid = await verifyStripeSignature(payload, stripeSignature, webhookSecret);
    if (!isValid) {
      return new Response('Invalid signature', { status: 400 });
    }
  }

  // Parse the JSON payload from Stripe.
  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    return new Response('Invalid payload', { status: 400 });
  }

  // Handle the checkout session completed event.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Stripe returns the donation amount in cents.
    const amount = session.amount_total;
    // Retrieve the current donation total from KV (default to "0" if not set).
    const currentTotal = parseInt(await env.DONATIONS.get('total') || "0");
    const newTotal = currentTotal + amount;
    await env.DONATIONS.put('total', newTotal.toString());
  }

  return new Response('Webhook received', { status: 200 });
}
