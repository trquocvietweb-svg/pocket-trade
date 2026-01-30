/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Script to enrich local JSON data with full card info from TCGdex API
 * Run: node scripts/enrichData.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../convex/data');
const API_BASE = 'https://api.tcgdex.net/v2/en/cards';

// Rate limiting
const DELAY_MS = 100; // 100ms between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCardData(cardId) {
  try {
    const response = await fetch(`${API_BASE}/${cardId}`);
    if (!response.ok) {
      console.error(`  Failed to fetch ${cardId}: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`  Error fetching ${cardId}:`, error.message);
    return null;
  }
}

async function enrichJsonFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  console.log(`\n📁 Processing ${filename}...`);
  
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const cards = data.cards || [];
  let enrichedCount = 0;
  let failedCount = 0;
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cardId = card.id; // e.g., "A1-003"
    
    process.stdout.write(`  [${i + 1}/${cards.length}] ${cardId} ${card.name}...`);
    
    const fullData = await fetchCardData(cardId);
    
    if (fullData) {
      // Enrich with new fields
      card.types = fullData.types || [];
      card.stage = fullData.stage || null;
      card.category = fullData.category || 'Pokemon';
      card.hp = fullData.hp || null;
      card.evolveFrom = fullData.evolveFrom || null;
      card.rarity = fullData.rarity || null;
      card.retreat = fullData.retreat || null;
      card.attacks = fullData.attacks || [];
      card.abilities = fullData.abilities || [];
      card.weaknesses = fullData.weaknesses || [];
      card.illustrator = fullData.illustrator || null;
      card.description = fullData.description || null;
      
      console.log(` ✓ ${fullData.category} ${fullData.types?.join('/') || ''} ${fullData.stage || ''}`);
      enrichedCount++;
    } else {
      console.log(' ✗ FAILED');
      failedCount++;
    }
    
    await sleep(DELAY_MS);
  }
  
  // Save enriched data
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✅ Saved! Enriched: ${enrichedCount}, Failed: ${failedCount}`);
  
  return { enrichedCount, failedCount };
}

async function main() {
  console.log('🚀 Starting data enrichment from TCGdex API...\n');
  
  // Only process files that haven't been enriched yet
  const ONLY_FILES = process.argv[2] ? [process.argv[2] + '_data.json'] : null;
  
  const allFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('_data.json'));
  const files = ONLY_FILES || allFiles.filter(f => {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
    return !data.cards[0]?.types; // Not enriched yet
  });
  
  console.log(`Processing ${files.length} files: ${files.join(', ')}`);
  
  let totalEnriched = 0;
  let totalFailed = 0;
  
  for (const file of files) {
    const result = await enrichJsonFile(file);
    totalEnriched += result.enrichedCount;
    totalFailed += result.failedCount;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Done! Total enriched: ${totalEnriched}, Failed: ${totalFailed}`);
}

main().catch(console.error);
