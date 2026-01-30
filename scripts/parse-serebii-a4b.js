/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Parse Deluxe Pack ex (A4B) data từ Serebii HTML artifact
 * Chạy: node scripts/parse-serebii-a4b.js
 */

const fs = require('fs');
const path = require('path');

// Read Serebii HTML artifact
const serebiiPath = 'C:\\Users\\VTOS\\.factory\\artifacts\\tool-outputs\\fetch_url-toolu_01PhyaK2bYSLvmuAJvwXgNWM-58553379.log';
const serebiiHtml = fs.readFileSync(serebiiPath, 'utf8');

// Type mapping from Serebii image names
const TYPE_MAP = {
  'grass': 'Grass',
  'fire': 'Fire',
  'water': 'Water',
  'electric': 'Lightning',
  'lightning': 'Lightning',
  'psychic': 'Psychic',
  'fighting': 'Fighting',
  'darkness': 'Darkness',
  'dark': 'Darkness',
  'metal': 'Metal',
  'steel': 'Metal',
  'dragon': 'Dragon',
  'colorless': 'Colorless',
  'normal': 'Colorless',
};

// Rarity mapping from Serebii image names - MUST match database symbols!
const RARITY_MAP = {
  'diamond1': '◆',
  'diamond2': '◆◆',
  'diamond3': '◆◆◆',
  'diamond4': '◆◆◆◆',
  'star1': '★',      // Black star (U+2605) - matches DB
  'star2': '★★',
  'star3': '★★★',
  'shiny2': '★★',    // Serebii uses shiny2 for 2-star in some places
  'crown': '♛',      // Crown symbol (U+265B) - matches DB
};

// Parse cards from HTML
const cardData = [];
const lines = serebiiHtml.split('\n');

let currentCard = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Look for card number pattern: "X / 353" or "X / 379"
  const numMatch = line.match(/(\d+)\s*\/\s*(?:353|379)/);
  if (numMatch) {
    if (currentCard && currentCard.localId) {
      cardData.push(currentCard);
    }
    currentCard = {
      localId: numMatch[1].padStart(3, '0'),
      rarity: '◆',
      type: '',
      category: 'Pokemon', // default
      trainerType: null,
    };
  }
  
  // Look for rarity icon (diamond1-4, star1-3, shiny2, crown)
  const rarityMatch = line.match(/image\/(diamond\d|star\d|shiny\d|crown)\.png/);
  if (rarityMatch && currentCard) {
    currentCard.rarity = RARITY_MAP[rarityMatch[1]] || '◆';
  }
  
  // Look for type icon in HP line (Pokemon cards)
  const typeMatch = line.match(/\*\*(\d+)HP\*\*!\[\]\(https:\/\/www\.serebii\.net\/tcgpocket\/image\/(\w+)\.png\)/);
  if (typeMatch && currentCard) {
    const type = TYPE_MAP[typeMatch[2].toLowerCase()];
    if (type) {
      currentCard.type = type;
      currentCard.category = 'Pokemon';
    }
  }
  
  // Detect Trainer cards - only on same line as card number pattern
  // Check for trainer type BEFORE moving to next card
  if (currentCard && line.includes('.shtml)') && !numMatch) {
    // This is a continuation line for currentCard, check for trainer type
    if (line.includes('| Trainer |')) {
      currentCard.category = 'Trainer';
      currentCard.trainerType = 'Item';
      currentCard.type = '';
    } else if (line.includes('Pokémon Tool') || line.includes('Pokemon Tool')) {
      currentCard.category = 'Trainer';
      currentCard.trainerType = 'Tool';
      currentCard.type = '';
    } else if (line.includes('| Supporter') || line.includes('Supporter<br>')) {
      currentCard.category = 'Trainer';
      currentCard.trainerType = 'Supporter';
      currentCard.type = '';
    }
  }
  
  // Also check on same line as card number
  if (numMatch && line.includes('| Trainer |')) {
    currentCard.category = 'Trainer';
    currentCard.trainerType = 'Item';
    currentCard.type = '';
  } else if (numMatch && (line.includes('Pokémon Tool') || line.includes('Pokemon Tool'))) {
    currentCard.category = 'Trainer';
    currentCard.trainerType = 'Tool';
    currentCard.type = '';
  } else if (numMatch && (line.includes('| Supporter') || line.includes('Supporter<br>'))) {
    currentCard.category = 'Trainer';
    currentCard.trainerType = 'Supporter';
    currentCard.type = '';
  }
}

// Push last card
if (currentCard && currentCard.localId) {
  cardData.push(currentCard);
}

console.log(`Parsed ${cardData.length} cards from Serebii`);

// Read existing A4B data
const existingDataPath = path.join(__dirname, '..', 'convex', 'data', 'A4B_data.json');
const existingData = JSON.parse(fs.readFileSync(existingDataPath, 'utf8'));

// Create lookup map
const serebiiMap = new Map();
cardData.forEach(card => {
  serebiiMap.set(card.localId, card);
});

// Fix known issues: Card 379 Rare Candy is Item not Tool
const card379 = serebiiMap.get('379');
if (card379 && card379.trainerType === 'Tool') {
  card379.trainerType = 'Item';
  console.log('Fixed Card 379 Rare Candy: Tool -> Item');
}

// Merge with existing data
const fixedCards = existingData.cards.map(card => {
  const serebiiInfo = serebiiMap.get(card.localId);
  if (serebiiInfo) {
    const result = {
      ...card,
      types: serebiiInfo.type ? [serebiiInfo.type] : [],
      rarity: serebiiInfo.rarity,
      category: serebiiInfo.category,
    };
    if (serebiiInfo.trainerType) {
      result.trainerType = serebiiInfo.trainerType;
    }
    return result;
  }
  console.log(`Warning: No Serebii data for card ${card.localId} - ${card.name}`);
  return card;
});

// Output stats
const stats = {
  total: fixedCards.length,
  pokemon: fixedCards.filter(c => c.category === 'Pokemon').length,
  trainer: fixedCards.filter(c => c.category === 'Trainer').length,
  items: fixedCards.filter(c => c.trainerType === 'Item').length,
  tools: fixedCards.filter(c => c.trainerType === 'Tool').length,
  supporters: fixedCards.filter(c => c.trainerType === 'Supporter').length,
};
console.log(`Stats:`, stats);

// Sample check
console.log('\nSample cards:');
console.log('Card 001 (Pokemon):', fixedCards.find(c => c.localId === '001'));
console.log('Card 197 (Aerodactyl):', fixedCards.find(c => c.localId === '197'));
console.log('Card 318 (Electrical Cord):', fixedCards.find(c => c.localId === '318'));
console.log('Card 326 (Cyrus Supporter):', fixedCards.find(c => c.localId === '326'));
console.log('Card 379 (Rare Candy Crown):', fixedCards.find(c => c.localId === '379'));

// Write output
const outputPath = path.join(__dirname, '..', 'convex', 'data', 'A4B_data_fixed.json');
const fixedData = {
  ...existingData,
  cards: fixedCards,
};
fs.writeFileSync(outputPath, JSON.stringify(fixedData, null, 2));
console.log(`\nFixed data written to ${outputPath}`);
