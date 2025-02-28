document.addEventListener('DOMContentLoaded', async () => {
  // Fetch the current donation total from the API (total is stored in cents)
  async function fetchDonations() {
    const response = await fetch('/api/get-donations');
    const data = await response.json();
    return data.total || 0;
  }

  // Update the progress bar and text display, converting cents to dollars.
  async function updateProgress() {
    const totalCents = await fetchDonations();
    const totalDollars = totalCents / 100;
    const goalDollars = 50000;
    const percentage = Math.min((totalDollars / goalDollars) * 100, 100);
    document.getElementById('progress-bar').style.width = percentage + '%';
    document.getElementById('progress-text').innerText =
      `$${totalDollars.toLocaleString(undefined, { maximumFractionDigits: 2 })} raised of $${goalDollars.toLocaleString()} goal`;
  }

  updateProgress();

  document.getElementById('donate-btn').addEventListener('click', async () => {
    const donationInput = document.getElementById('donation-amount');
    let donationAmount = parseFloat(donationInput.value);
    if (isNaN(donationAmount) || donationAmount < 1) {
      alert("Please enter a valid donation amount of at least $1.");
      return;
    }
    
    // Create a checkout session with the provided donation amount (in dollars)
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donationAmount })
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Error creating checkout session');
    }
  });
});
