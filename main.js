const targetAmount = 50000; // Goal amount in USD

// Fetch and update the donation progress
async function updateProgress() {
  try {
    const response = await fetch('/progress');
    const data = await response.json();
    const currentTotal = data.total || 0;

    // Update the progress text
    document.getElementById('progress-text').innerText = `$${currentTotal} / $${targetAmount}`;

    // Update the progress bar width
    const progressPercent = Math.min((currentTotal / targetAmount) * 100, 100);
    document.getElementById('progress-bar').style.width = progressPercent + '%';
  } catch (error) {
    console.error('Error fetching progress:', error);
  }
}

// Handle the donation button click
document.getElementById('donate-button').addEventListener('click', async () => {
  const amount = parseFloat(document.getElementById('donation-amount').value);

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid donation amount.');
    return;
  }

  try {
    // Send request to create a Stripe Checkout session
    const response = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const session = await response.json();

    if (session.url) {
      window.location.href = session.url; // Redirect to Stripe Checkout
    } else {
      alert('Payment failed. Please try again.');
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    alert('There was an error processing your payment.');
  }
});

// Load the current progress on page load
updateProgress();
