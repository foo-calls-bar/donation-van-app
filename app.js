document.addEventListener('DOMContentLoaded', async () => {
  // Fetch the current donation total
  async function fetchDonations() {
    const response = await fetch('/api/get-donations');
    const data = await response.json();
    return data.total || 0;
  }

  async function updateProgress() {
    const total = await fetchDonations();
    const goal = 50000; // $50,000 goal in dollars
    const percentage = Math.min((total / goal) * 100, 100);
    document.getElementById('progress-bar').style.width = percentage + '%';
    document.getElementById('progress-text').innerText = `$${total} raised of $${goal} goal`;
  }

  updateProgress();

  document.getElementById('donate-btn').addEventListener('click', async () => {
    // Create a checkout session on the backend
    const response = await fetch('/api/create-checkout-session', { method: 'POST' });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Error creating checkout session');
    }
  });
});
