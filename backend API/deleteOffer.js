const fs = require('fs').promises;
const readline = require('readline');

const OFFERS_FILE = './data/offers.json';
const PAYOUTS_FILE = './data/offerPayouts.json';

// Read/write JSON helpers
async function readJSON(file) {
  const data = await fs.readFile(file, 'utf8');
  return JSON.parse(data);
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Terminal prompt helper
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main delete function
async function deleteOffer() {
  try {
    const offerId = await prompt('Enter the Offer ID to delete: ');

    const [offers, payouts] = await Promise.all([
      readJSON(OFFERS_FILE),
      readJSON(PAYOUTS_FILE)
    ]);

    const offerIndex = offers.findIndex(o => o.id === offerId);
    if (offerIndex === -1) {
      console.log('Offer not found!');
      return;
    }

    // Remove offer and its payout
    offers.splice(offerIndex, 1);

    const payoutIndex = payouts.findIndex(p => p.offerId === offerId);
    if (payoutIndex !== -1) {
      payouts.splice(payoutIndex, 1);
    }

    // Save updated files
    await Promise.all([
      writeJSON(OFFERS_FILE, offers),
      writeJSON(PAYOUTS_FILE, payouts)
    ]);

    console.log('Offer deleted successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteOffer();
