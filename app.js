document.addEventListener('DOMContentLoaded', async () => {
  // Fetch the current donation total from the API (total is in cents)
  async function fetchDonations() {
    const response = await fetch('/api/get-donations');
    const data = await response.json();
    return data.total || 0;
  }

  async function updateProgress() {
    const totalCents = await fetchDonations();
    // Convert cents to dollars
    const totalDollars = totalCents / 100;
    const goalDollars = 50000; // $50,000 goal in dollars

    const percentage = Math.min((totalDollars / goalDollars) * 100, 100);
    document.getElementById('progress-bar').style.width = percentage + '%';

    // Format numbers nicely with commas and two decimals
    document.getElementById('progress-text').innerText =
      `$${totalDollars.toLocaleString(undefined, { maximumFractionDigits: 2 })} raised of $${goalDollars.toLocaleString()} goal`;
  }

  updateProgress();

  document.getElementById('donate-btn').addEventListener('click', async () => {
    const response = await fetch('/api/create-checkout-session', { method: 'POST' });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Error creating checkout session');
    }
  });
});
