/**
 * Verify all card images exist with correct naming
 * Usage: node scripts/verify-images.mjs
 */

import { readdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'convex', 'data');
const IMAGES_DIR = join(__dirname, '..', 'public', 'images', 'cards');

const SET_FOLDERS = {
  "A1": "Genetic Apex", "A1a": "Mythical Island", "A2": "Space-Time Smackdown",
  "A2a": "Triumphant Light", "A2b": "Shining Revelry", "A3": "Celestial Guardians",
  "A3a": "Extradimensional Crisis", "A3b": "Eevee Grove", "A4": "Wisdom of Sea and Sky",
  "A4a": "Secluded Springs", "A4B": "Deluxe Pack ex", "B1": "Mega Rising",
  "B1A": "Crimson Blaze", "B1a": "Crimson Blaze", "P-A": "Promos-A", "P-B": "Promos-B",
};

// Same logic as seedData.ts getImageUrl
function getImagePath(setCode, localId, name) {
  const folder = SET_FOLDERS[setCode];
  if (!folder) return null;
  
  let safeName = name.replace(/:/g, "_");
  if (setCode !== "A1") safeName = safeName.replace(/'/g, "_");
  
  let filename;
  if (setCode === "A4B") {
    filename = `A4B-${localId}_${safeName}.webp`;
  } else if (setCode === "B1A" || setCode === "B1a") {
    const b1aName = safeName.replace(/[ -]/g, "_");
    filename = `B1A-${localId}_${b1aName}.webp`;
  } else if (setCode === "P-B") {
    filename = `PROMO-B-${localId}_${safeName}.webp`;
  } else {
    filename = `${localId}_${safeName}.webp`;
  }
  
  return join(IMAGES_DIR, folder, filename);
}

async function main() {
  console.log('=== Verifying Card Images ===\n');
  
  const dataFiles = readdirSync(DATA_DIR).filter(f => f.endsWith('_data.json'));
  
  const missing = [];
  let total = 0;
  
  for (const file of dataFiles) {
    const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
    const setCode = data.id;
    const cards = data.cards || [];
    let setMissing = 0;
    
    for (const card of cards) {
      total++;
      const imgPath = getImagePath(setCode, card.localId, card.name);
      
      if (!imgPath || !existsSync(imgPath)) {
        setMissing++;
        missing.push({ setCode, localId: card.localId, name: card.name, expected: imgPath });
      }
    }
    
    const status = setMissing === 0 ? '✓' : `✗ ${setMissing} missing`;
    console.log(`${setCode.padEnd(5)} ${(SET_FOLDERS[setCode] || 'Unknown').padEnd(25)} ${cards.length.toString().padStart(3)} cards  ${status}`);
  }
  
  console.log(`\nTotal: ${total} cards, ${missing.length} missing images`);
  
  if (missing.length > 0) {
    console.log('\n=== Missing Images ===\n');
    missing.forEach(m => {
      console.log(`${m.setCode}-${m.localId}: ${m.name}`);
      console.log(`  Expected: ${m.expected}\n`);
    });
  }
}

main().catch(console.error);
