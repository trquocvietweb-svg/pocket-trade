/**
 * Check missing card images and download from TCGdex
 * Usage: node scripts/check-missing-images.mjs
 */

import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'convex', 'data');
const IMAGES_DIR = join(__dirname, '..', 'public', 'images', 'cards');

const CONCURRENCY = 16;

// Set code to folder name mapping
const SET_FOLDERS = {
  "A1": "Genetic Apex",
  "A1a": "Mythical Island",
  "A2": "Space-Time Smackdown",
  "A2a": "Triumphant Light",
  "A2b": "Shining Revelry",
  "A3": "Celestial Guardians",
  "A3a": "Extradimensional Crisis",
  "A3b": "Eevee Grove",
  "A4": "Wisdom of Sea and Sky",
  "A4a": "Secluded Springs",
  "A4B": "Deluxe Pack ex",
  "B1": "Mega Rising",
  "B1A": "Crimson Blaze",
  "P-A": "Promos-A",
  "P-B": "Promos-B",
};

// Generate expected local image path
function getExpectedImagePath(setCode, localId, name) {
  const folder = SET_FOLDERS[setCode];
  if (!folder) return null;
  
  let safeName = name.replace(/:/g, "_");
  if (setCode !== "A1") {
    safeName = safeName.replace(/'/g, "_");
  }
  
  let filename;
  if (setCode === "A4B") {
    filename = `A4B-${localId}_${safeName}.webp`;
  } else if (setCode === "B1A") {
    filename = `B1A-${localId}_${safeName.replace(/ /g, "_")}.webp`;
  } else if (setCode === "P-B") {
    filename = `PROMO-B-${localId}_${safeName}.webp`;
  } else {
    filename = `${localId}_${safeName}.webp`;
  }
  
  return join(IMAGES_DIR, folder, filename);
}

// Batch processing
async function processBatch(items, processor, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

// Download image from TCGdex
async function downloadImage(card, destPath) {
  const url = `${card.image}.webp`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const buffer = await res.arrayBuffer();
    const dir = dirname(destPath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(destPath, Buffer.from(buffer));
    return { success: true, card, destPath };
  } catch (err) {
    return { success: false, card, error: err.message };
  }
}

async function main() {
  console.log('=== Checking Missing Card Images ===\n');
  
  // Read all JSON data files
  const dataFiles = readdirSync(DATA_DIR).filter(f => f.endsWith('_data.json'));
  
  const missingImages = [];
  let totalCards = 0;
  
  for (const file of dataFiles) {
    const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
    const setCode = data.id;
    const cards = data.cards || [];
    
    for (const card of cards) {
      totalCards++;
      const expectedPath = getExpectedImagePath(setCode, card.localId, card.name);
      
      if (expectedPath && !existsSync(expectedPath)) {
        missingImages.push({
          setCode,
          localId: card.localId,
          name: card.name,
          image: card.image,
          expectedPath,
        });
      }
    }
  }
  
  console.log(`Total cards: ${totalCards}`);
  console.log(`Missing images: ${missingImages.length}\n`);
  
  if (missingImages.length === 0) {
    console.log('All images are present!');
    return;
  }
  
  // Group by set for display
  const bySet = {};
  for (const img of missingImages) {
    if (!bySet[img.setCode]) bySet[img.setCode] = [];
    bySet[img.setCode].push(img);
  }
  
  console.log('Missing images by set:');
  for (const [setCode, imgs] of Object.entries(bySet)) {
    console.log(`\n${setCode} (${SET_FOLDERS[setCode]}): ${imgs.length} missing`);
    imgs.slice(0, 5).forEach(img => {
      console.log(`  - ${img.localId}: ${img.name}`);
    });
    if (imgs.length > 5) console.log(`  ... and ${imgs.length - 5} more`);
  }
  
  // Ask to download
  console.log('\n=== Downloading Missing Images ===\n');
  
  let downloaded = 0;
  let failed = 0;
  
  for (const [setCode, imgs] of Object.entries(bySet)) {
    console.log(`\nDownloading ${setCode}...`);
    
    const results = await processBatch(imgs, async (img) => {
      return downloadImage(img, img.expectedPath);
    }, CONCURRENCY);
    
    for (const result of results) {
      if (result.success) {
        downloaded++;
        console.log(`  ✓ ${result.card.localId}: ${result.card.name}`);
      } else {
        failed++;
        console.log(`  ✗ ${result.card.localId}: ${result.card.name} - ${result.error}`);
      }
    }
  }
  
  console.log(`\n=== Done! ===`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
