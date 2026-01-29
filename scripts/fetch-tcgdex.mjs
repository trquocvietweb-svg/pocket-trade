/**
 * Fetch TCGdex API data với đa luồng (16 concurrent requests)
 * Node 22 native fetch
 * Usage: node scripts/fetch-tcgdex.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'convex', 'data');

const BASE_URL = 'https://api.tcgdex.net/v2/en';
const CONCURRENCY = 16;

// TCG Pocket sets
const SETS = [
  'A1', 'A1a', 
  'A2', 'A2a', 'A2b',
  'A3', 'A3a', 'A3b',
  'A4', 'A4a', 'A4B',
  'B1', 'B1A',
  'P-A', 'P-B'
];

// Batch processing với concurrency limit
async function processBatch(items, processor, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    console.log(`  Processed ${Math.min(i + concurrency, items.length)}/${items.length}`);
  }
  return results;
}

// Fetch với retry
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// Fetch chi tiết 1 card
async function fetchCardDetail(cardId) {
  try {
    const card = await fetchWithRetry(`${BASE_URL}/cards/${cardId}`);
    return {
      id: card.id,
      localId: card.localId,
      name: card.name,
      image: card.image || `https://assets.tcgdex.net/en/tcgp/${card.set?.id || 'A1'}/${card.localId}`,
      boosters: card.boosters?.map(b => b.id || b) || [],
      types: card.types || [],
      stage: card.stage || 'Basic',
      category: card.category || 'Pokemon',
      hp: card.hp || null,
      evolveFrom: card.evolveFrom || null,
      rarity: card.rarity || 'Common',
      retreat: card.retreat || 0,
      attacks: card.attacks || [],
      abilities: card.abilities || [],
      weaknesses: card.weaknesses || [],
      illustrator: card.illustrator || '',
      description: card.description || '',
      // Trainer specific
      trainerType: card.trainerType || null,
      effect: card.effect || null,
      // Energy specific  
      energyType: card.energyType || null,
    };
  } catch (err) {
    console.error(`  Error fetching ${cardId}: ${err.message}`);
    return null;
  }
}

// Fetch 1 set
async function fetchSet(setId) {
  console.log(`\nFetching set: ${setId}`);
  
  try {
    // Lấy thông tin set và list cards
    const setData = await fetchWithRetry(`${BASE_URL}/sets/${setId}`);
    console.log(`  Found ${setData.cards?.length || 0} cards in ${setData.name}`);
    
    if (!setData.cards?.length) {
      console.log(`  No cards found for ${setId}`);
      return null;
    }
    
    // Fetch chi tiết từng card với đa luồng
    const cardIds = setData.cards.map(c => c.id);
    const cards = await processBatch(cardIds, fetchCardDetail, CONCURRENCY);
    
    // Filter null results
    const validCards = cards.filter(c => c !== null);
    
    return {
      id: setData.id,
      name: setData.name,
      logo: setData.logo || null,
      symbol: setData.symbol || null,
      cardCount: setData.cardCount || { total: validCards.length },
      boosters: setData.boosters || [],
      cards: validCards,
    };
  } catch (err) {
    console.error(`Error fetching set ${setId}: ${err.message}`);
    return null;
  }
}

// Main
async function main() {
  console.log('=== TCGdex Data Fetcher ===');
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Sets: ${SETS.join(', ')}`);
  
  mkdirSync(DATA_DIR, { recursive: true });
  
  for (const setId of SETS) {
    const data = await fetchSet(setId);
    
    if (data) {
      const filename = `${setId.replace('-', '_')}_data.json`;
      const filepath = join(DATA_DIR, filename);
      
      writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`  Saved: ${filename} (${data.cards.length} cards)`);
    }
  }
  
  console.log('\n=== Done! ===');
}

main().catch(console.error);
