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

// Helper to update payout
async function getPayout(existingPayout) {
  const type = await prompt(`Enter payout type (CPA/FIXED/CPA_AND_FIXED) [${existingPayout.type}]: `);
  const payoutType = type || existingPayout.type;

  const payout = { type: payoutType };

  if (payoutType === 'CPA' || payoutType === 'CPA_AND_FIXED') {
    const base = await prompt(`Enter base CPA amount [${existingPayout.cpaAmount || 0}]: `);
    payout.cpaAmount = base ? Number(base) : existingPayout.cpaAmount || 0;

    // Country overrides
    const countryInput = await prompt('Do you want to edit country-specific CPA overrides? (yes/no): ');
    if (countryInput.toLowerCase() === 'yes') {
      payout.cpaCountryOverrides = {};
      while (true) {
        const country = await prompt('Enter country code (or press Enter to finish): ');
        if (!country) break;
        const amount = Number(await prompt(`Enter CPA for ${country}: `));
        payout.cpaCountryOverrides[country.toUpperCase()] = amount;
      }
    } else if (existingPayout.cpaCountryOverrides) {
      payout.cpaCountryOverrides = existingPayout.cpaCountryOverrides;
    }
  }

  if (payoutType === 'FIXED' || payoutType === 'CPA_AND_FIXED') {
    const fixed = await prompt(`Enter fixed amount [${existingPayout.fixedAmount || 0}]: `);
    payout.fixedAmount = fixed ? Number(fixed) : existingPayout.fixedAmount || 0;
  }

  return payout;
}

// Main update function
async function updateOffer() {
  try {
    const offerId = await prompt('Enter the Offer ID to update: ');

    const [offers, payouts] = await Promise.all([
      readJSON(OFFERS_FILE),
      readJSON(PAYOUTS_FILE)
    ]);

    const offer = offers.find(o => o.id === offerId);
    if (!offer) {
      console.log('Offer not found!');
      return;
    }

    const payout = payouts.find(p => p.offerId === offerId);

    // Update fields
    const newTitle = await prompt(`Enter new title [${offer.title}]: `);
    const newDescription = await prompt(`Enter new description [${offer.description}]: `);
    const newCategories = await prompt(`Enter new categories comma separated [${offer.categories.join(', ')}]: `);

    if (newTitle) offer.title = newTitle;
    if (newDescription) offer.description = newDescription;
    if (newCategories) offer.categories = newCategories.split(',').map(c => c.trim());

    // Update payout
    const newPayout = await getPayout(payout);

    // Replace old payout
    const payoutIndex = payouts.findIndex(p => p.offerId === offerId);
    payouts[payoutIndex] = { offerId, ...newPayout };

    // Save files
    await Promise.all([
      writeJSON(OFFERS_FILE, offers),
      writeJSON(PAYOUTS_FILE, payouts)
    ]);

    console.log('Offer updated successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateOffer();
