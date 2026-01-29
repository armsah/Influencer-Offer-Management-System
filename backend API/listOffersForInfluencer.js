const fs = require('fs').promises;
const readline = require('readline');

const OFFERS_FILE = './data/offers.json';
const CUSTOM_PAYOUTS_FILE = './data/influencerCustomPayouts.json'; // your JSON with influencerId

// Read JSON helper
async function readJSON(file) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Prompt helper
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(question, answer => {
    rl.close();
    resolve(answer);
  }));
}

// Main function
async function listOffersForInfluencer() {
  try {
    const influencerId = await prompt('Enter Influencer ID: ');

    if (!influencerId) {
      console.log('Influencer ID is required!');
      return;
    }

    const offers = await readJSON(OFFERS_FILE);
    const customPayouts = await readJSON(CUSTOM_PAYOUTS_FILE);

    // Filter payouts for this influencer
    const influencerPayouts = customPayouts.filter(p => p.influencerId === influencerId);

    if (influencerPayouts.length === 0) {
      console.log(`No offers found for influencer ${influencerId}`);
      return;
    }

    console.log(`\nOffers for Influencer ${influencerId}:\n`);

    influencerPayouts.forEach(payout => {
      const offer = offers.find(o => o.id === payout.offerId);

      console.log('---');
      if (offer) {
        console.log(`Title: ${offer.title}`);
        console.log(`Description: ${offer.description}`);
        console.log(`Categories: ${offer.categories.join(', ')}`);
      } else {
        console.log(`Offer ID: ${payout.offerId} (offer details not found)`);
      }

      console.log('Payout:');
      if (payout.type === 'FIXED') {
        console.log(`  Type: FIXED`);
        console.log(`  Amount: $${payout.fixedAmount}`);
      } else if (payout.type === 'CPA') {
        console.log(`  Type: CPA`);
        console.log(`  Base CPA: $${payout.cpaAmount}`);
        if (payout.cpaCountryOverrides) {
          console.log(`  Country Overrides: ${JSON.stringify(payout.cpaCountryOverrides)}`);
        }
      } else if (payout.type === 'CPA_AND_FIXED') {
        console.log(`  Type: CPA + FIXED`);
        console.log(`  Base CPA: $${payout.cpaAmount}`);
        console.log(`  Fixed Amount: $${payout.fixedAmount}`);
        if (payout.cpaCountryOverrides) {
          console.log(`  Country Overrides: ${JSON.stringify(payout.cpaCountryOverrides)}`);
        }
      }
    });

    console.log('\nEnd of list.\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listOffersForInfluencer();
