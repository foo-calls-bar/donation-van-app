export async function onRequest(context) {
  const { env } = context;
  
  // Simulate a success message
  return new Response(`
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Thank You!</title>
        <style>
          body { text-align: center; font-family: Arial, sans-serif; padding: 50px; }
          h1 { color: #007bff; }
        </style>
      </head>
      <body>
        <h1>🎉 Thank You for Your Donation!</h1>
        <p>Your generosity helps us get a wheelchair-accessible van.</p>
        <a href="/">Return Home</a>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}
