const fs = require('fs').promises;
const readline = require('readline');

const OFFERS_FILE = './data/offers.json';
const PAYOUTS_FILE = './data/offerPayouts.json';
const CUSTOM_PAYOUTS_FILE = './data/influencerCustomPayouts.json'; // new file

// Read and write JSON files
async function readJSON(file) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Helper function to prompt user
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Validate and parse payout input
async function getPayout(type) {
  const payout = { type };

  if (type === 'CPA' || type === 'CPA_AND_FIXED') {
    // Base CPA
    payout.cpaAmount = Number(await prompt('Enter base CPA amount: '));

    // Ask if user wants country-specific overrides
    const overrideInput = await prompt('Do you want country-specific CPA overrides? (yes/no): ');
    if (overrideInput.toLowerCase() === 'yes') {
      payout.cpaCountryOverrides = {};

      while (true) {
        const country = await prompt('Enter country code (or press Enter to finish): ');
        if (!country) break;

        const amount = Number(await prompt(`Enter CPA for ${country}: `));
        payout.cpaCountryOverrides[country.toUpperCase()] = amount;
      }
    }
  }

  if (type === 'FIXED' || type === 'CPA_AND_FIXED') {
    payout.fixedAmount = Number(await prompt('Enter Fixed amount: '));
  }

  return payout;
}

async function getCustomPayouts(offerId) {
  const customPayouts = [];
  const addCustom = await prompt('Do you want to add a custom payout for a specific influencer? (yes/no): ');

  if (addCustom.toLowerCase() === 'yes') {
    const influencerId = await prompt('Enter influencer ID: ');
    const type = await prompt('Enter payout type for this influencer (CPA/FIXED/CPA_AND_FIXED): ');
    const payout = await getPayout(type);

    customPayouts.push({
      offerId,
      influencerId,
      ...payout
    });
  }

  return customPayouts;
}


// Main function
async function createOffer() {
  try {
    const title = await prompt('Enter offer title: ');
    const description = await prompt('Enter offer description: ');
    const catInput = await prompt('Enter categories (comma separated): ');
    const type = await prompt('Enter payout type (CPA/FIXED/CPA_AND_FIXED): ');

    if (!['CPA', 'FIXED', 'CPA_AND_FIXED'].includes(type)) {
      throw new Error('Invalid payout type');
    }

    const categories = catInput.split(',').map(c => c.trim());
    const payout = await getPayout(type);

    // Read existing data
    const [offers, payouts, customPayoutsData] = await Promise.all([
      readJSON(OFFERS_FILE),
      readJSON(PAYOUTS_FILE),
      readJSON(CUSTOM_PAYOUTS_FILE)
    ]);

    // Create new offer
    const offerId = `offer_${Date.now()}`;
    offers.push({ id: offerId, title, description, categories });
    payouts.push({ offerId, ...payout });

    // Add custom payouts
    const customPayouts = await getCustomPayouts(offerId);

    // Merge with existing custom payouts
    const updatedCustomPayouts = [...customPayoutsData, ...customPayouts];

    // Write updated data
    await Promise.all([
      writeJSON(OFFERS_FILE, offers),
      writeJSON(PAYOUTS_FILE, payouts),
      writeJSON(CUSTOM_PAYOUTS_FILE, updatedCustomPayouts)
    ]);

    console.log('Offer created with ID:', offerId);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createOffer();
