const targetAmount = 50000; // Your fundraising goal

// Fetch and update the donation progress
async function updateProgress() {
  try {
    const response = await fetch('/progress');
    const data = await response.json();
    const currentTotal = data.total;
    document.getElementById('progress-text').innerText = `$${currentTotal} / $${targetAmount}`;
    const progressPercent = Math.min((currentTotal / targetAmount) * 100, 100);
    document.getElementById('progress-bar').style.width = progressPercent + '%';
  } catch (error) {
    console.error('Error fetching progress:', error);
  }
}

// Handle the donation form submission
document.getElementById('donation-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const amount = parseFloat(document.getElementById('donation-amount').value);
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid donation amount.');
    return;
  }
  
  try {
    const response = await fetch('/donate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    });
    
    if (response.ok) {
      alert(`Thank you for donating $${amount}!`);
      updateProgress();
    } else {
      const errorData = await response.json();
      alert('Error: ' + errorData.error);
    }
  } catch (error) {
    console.error('Error submitting donation:', error);
    alert('There was an error processing your donation.');
  }
});

// Load the current progress on page load
updateProgress();
