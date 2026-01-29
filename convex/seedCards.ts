import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Import JSON data files for card list
import A1_data from "./data/A1_data.json";
import A1a_data from "./data/A1a_data.json";
import A2_data from "./data/A2_data.json";
import A2a_data from "./data/A2a_data.json";
import A2b_data from "./data/A2b_data.json";
import A3_data from "./data/A3_data.json";
import A3a_data from "./data/A3a_data.json";
import A3b_data from "./data/A3b_data.json";
import A4_data from "./data/A4_data.json";
import A4a_data from "./data/A4a_data.json";
import A4B_data from "./data/A4B_data.json";
import B1_data from "./data/B1_data.json";
import B1A_data from "./data/B1A_data.json";
import PA_data from "./data/P-A_data.json";
import PB_data from "./data/P-B_data.json";

// Set code to folder name mapping
const SET_FOLDERS: Record<string, string> = {
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

// Set code to set name mapping (dùng để tìm set trong DB)
const SET_NAMES: Record<string, string> = {
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
  "P-A": "Promo-A",
  "P-B": "Promo-B",
};

// Trainer card names - dùng để detect trainer cards
const TRAINER_SUPPORTERS = [
  "professor", "oak", "misty", "brock", "erika", "koga", "blaine", "giovanni",
  "sabrina", "lt. surge", "blue", "red", "leaf", "cyrus", "cynthia", "dawn",
  "lucas", "rowan", "mars", "jupiter", "saturn", "cheren", "bianca", "n",
  "colress", "ghetsis", "skyla", "elesa", "iris", "roxie", "marlon", "burgh",
  "clay", "lenora", "striaton", "cilan", "chili", "cress", "drayden", "team rocket",
  "pokémon center lady", "pokemon center lady", "iono", "arven", "nemona", "penny",
  "jacq", "clavell", "grusha", "larry", "ryme", "tulip", "brassius", "katy", "kofu",
  "hassel", "poppy", "rika", "geeta", "nurse", "pokémon breeder", "pokemon breeder",
  "pokémon fan club", "pokémon ranger", "pokémon collector", "poke kid", "beauty"
];

const TRAINER_ITEMS = [
  "poké ball", "poke ball", "great ball", "ultra ball", "master ball", "nest ball",
  "potion", "super potion", "hyper potion", "max potion", "full heal", "antidote",
  "switch", "escape rope", "air balloon", "energy retrieval", "energy search",
  "rare candy", "x speed", "x attack", "x defense", "hand scope", "rocky helmet",
  "exp. share", "lucky egg", "muscle band", "choice band", "leftovers", "red card",
  "vs seeker", "crushing hammer", "enhanced hammer", "max revive", "revive",
  "fossil", "budding expeditioner", "old amber", "helix fossil", "dome fossil"
];

// Rarity mapping từ TCGdex API sang DB name
const RARITY_API_MAP: Record<string, string> = {
  // Diamond rarities
  "One Diamond": "◆",
  "Two Diamond": "◆◆",
  "Three Diamond": "◆◆◆",
  "Four Diamond": "◆◆◆◆",
  // Star rarities
  "One Star": "★",
  "Two Star": "★★",
  "Three Star": "★★★",
  // Crown
  "Crown": "♛",
  // Fallbacks từ old format
  "common": "◆",
  "uncommon": "◆◆",
  "rare": "◆◆◆",
  "double-rare": "◆◆◆◆",
  "art-rare": "★",
  "super-rare": "★★",
  "immersive": "★★★",
  "crown": "♛",
  // Promo
  "Promo": "Promo",
};

interface CardData {
  id: string;
  name: string;
  localId: string;
  image: string;
  boosters?: string[];
  // New fields from TCGdex API
  types?: string[];
  stage?: string;
  category?: string;
  rarity?: string;
  trainerType?: string;
}

interface SetData {
  id: string;
  name: string;
  cards: CardData[];
  boosters?: { id: string; name: string }[];
}

// All sets data
const ALL_SETS: SetData[] = [
  A1_data as SetData,
  A1a_data as SetData,
  A2_data as SetData,
  A2a_data as SetData,
  A2b_data as SetData,
  A3_data as SetData,
  A3a_data as SetData,
  A3b_data as SetData,
  A4_data as SetData,
  A4a_data as SetData,
  A4B_data as SetData,
  B1_data as SetData,
  B1A_data as SetData,
  PA_data as SetData,
  PB_data as SetData,
];

// ==================== RARITY CALCULATION (from pokemon_nextjs) ====================

// B1 Mega Rising - Uncommon cards (◊◊)
const B1_UNCOMMON_IDS = new Set([
  "009", "012", "024", "026", "029", "034", "040", "042", "047", "054",
  "059", "065", "066", "072", "075", "077", "079", "083", "087", "091",
  "093", "096", "098", "100", "104", "108", "113", "116", "118", "123",
  "127", "129", "131", "133", "140", "142", "144", "146", "150", "153",
  "156", "162", "164", "167", "171", "178", "182", "186", "189", "200",
  "202", "205", "206", "207", "208", "210", "212", "213", "215", "217",
  "218", "219", "220", "221", "222", "223", "224", "225", "226"
]);

// B1 Mega Rising - Rare cards (◊◊◊)
const B1_RARE_IDS = new Set([
  "005", "007", "010", "018", "020", "027", "032", "035", "043", "046",
  "051", "055", "057", "067", "069", "070", "080", "084", "088", "105",
  "106", "109", "111", "114", "120", "132", "134", "136", "137", "147",
  "149", "154", "157", "158", "165", "168", "169", "172", "175", "179",
  "187", "192", "194", "197", "203", "214", "216"
]);

// B1 Mega Rising - Double-rare/EX cards (◊◊◊◊)
const B1_DOUBLE_RARE_IDS = new Set([
  "002", "016", "031", "036", "052", "073", "081", "085", "102", "121",
  "124", "151", "160", "174", "183"
]);

function getRarityFromId(localId: string, setId: string): string {
  const num = parseInt(localId, 10);
  
  // Genetic Apex (A1) - 286 cards
  if (setId === "A1") {
    if (num <= 178) return "common";
    if (num <= 207) return "uncommon";
    if (num <= 226) return "rare";
    if (num <= 253) return "double-rare";
    if (num <= 271) return "art-rare";
    if (num <= 283) return "super-rare";
    if (num <= 285) return "immersive";
    return "crown";
  }
  
  // Mythical Island (A1a) - 86 cards
  if (setId === "A1a") {
    if (num <= 52) return "common";
    if (num <= 62) return "uncommon";
    if (num <= 68) return "rare";
    if (num <= 77) return "double-rare";
    if (num <= 82) return "art-rare";
    if (num <= 84) return "super-rare";
    if (num <= 85) return "immersive";
    return "crown";
  }
  
  // Space-Time Smackdown (A2) - 207 cards
  if (setId === "A2") {
    if (num >= 206) return "crown";
    if (num >= 196 && num <= 205) return "super-rare";
    if (num >= 190 && num <= 195) return "art-rare";
    if (num >= 180 && num <= 189) return "double-rare";
    if (num >= 163 && num <= 179) return "common";
    if (num <= 96) return "common";
    if (num <= 120) return "uncommon";
    if (num <= 135) return "rare";
    if (num <= 150) return "double-rare";
    if (num <= 157) return "art-rare";
    if (num <= 162) return "super-rare";
    return "common";
  }
  
  // Triumphant Light (A2a) - 96 cards
  if (setId === "A2a") {
    if (num <= 56) return "common";
    if (num <= 68) return "uncommon";
    if (num <= 75) return "rare";
    if (num <= 84) return "double-rare";
    if (num <= 91) return "art-rare";
    if (num <= 94) return "super-rare";
    if (num <= 95) return "immersive";
    return "crown";
  }
  
  // Shining Revelry (A2b) - 111 cards
  if (setId === "A2b") {
    if (num <= 44) return "common";
    if (num <= 57) return "uncommon";
    if (num <= 68) return "rare";
    if (num <= 78) return "double-rare";
    if (num <= 87) return "art-rare";
    if (num <= 96) return "super-rare";
    if (num <= 106) return "art-rare";
    if (num <= 110) return "super-rare";
    return "crown";
  }
  
  // Celestial Guardians (A3) - 239 cards
  if (setId === "A3") {
    if (num >= 238) return "crown";
    if (num >= 230 && num <= 237) return "super-rare";
    if (num >= 210 && num <= 229) return "art-rare";
    if (num >= 198 && num <= 209) return "super-rare";
    if (num >= 190 && num <= 197) return "art-rare";
    if (num >= 180 && num <= 189) return "double-rare";
    if (num >= 175 && num <= 179) return "common";
    if (num <= 100) return "common";
    if (num <= 125) return "uncommon";
    if (num <= 140) return "rare";
    if (num <= 155) return "double-rare";
    if (num <= 165) return "art-rare";
    if (num <= 172) return "super-rare";
    if (num <= 174) return "immersive";
    return "common";
  }
  
  // Wisdom of Sea and Sky (A4) - 241 cards
  if (setId === "A4") {
    if (num <= 100) return "common";
    if (num <= 130) return "uncommon";
    if (num <= 161) return "rare";
    if (num <= 190) return "double-rare";
    if (num <= 215) return "art-rare";
    if (num <= 235) return "super-rare";
    if (num <= 239) return "immersive";
    return "crown";
  }
  
  // Mini sets (A3a, A3b, A4a)
  if (setId === "A3a" || setId === "A3b" || setId === "A4a") {
    if (num <= 55) return "common";
    if (num <= 67) return "uncommon";
    if (num <= 75) return "rare";
    if (num <= 84) return "double-rare";
    if (num <= 90) return "art-rare";
    if (num <= 94) return "super-rare";
    if (num <= 95) return "immersive";
    return "crown";
  }
  
  // Deluxe Pack ex (A4B)
  if (setId === "A4B") {
    if (num === 379) return "crown";
    if (num === 376) return "immersive";
    if (num >= 377 && num <= 378) return "super-rare";
    if (num >= 354 && num <= 375) return "super-rare";
    // For regular cards, detect from name
    return "common"; // Will be overridden by name detection
  }
  
  // Mega Rising (B1) - 331 cards
  if (setId === "B1") {
    if (num >= 329) return "crown";
    if (num >= 317 && num <= 328) return "super-rare";
    if (num >= 287 && num <= 316) return "art-rare";
    if (num >= 251 && num <= 286) return "super-rare";
    if (num >= 227 && num <= 250) return "art-rare";
    // For base cards (001-226), use lookup tables
    if (B1_DOUBLE_RARE_IDS.has(localId)) return "double-rare";
    if (B1_RARE_IDS.has(localId)) return "rare";
    if (B1_UNCOMMON_IDS.has(localId)) return "uncommon";
    return "common";
  }
  
  // Crimson Blaze (B1A) - 103 cards
  if (setId === "B1A") {
    if (num <= 44) return "common";
    if (num <= 57) return "uncommon";
    if (num <= 65) return "rare";
    if (num <= 69) return "double-rare";
    if (num <= 75) return "art-rare";
    if (num <= 82) return "super-rare";
    if (num <= 87) return "immersive";
    if (num <= 97) return "art-rare";
    if (num <= 102) return "super-rare";
    return "crown";
  }
  
  // Promo packs
  if (setId === "P-A" || setId === "P-B") {
    return "art-rare";
  }
  
  // Default fallback
  return "common";
}

// Detect A4B rarity from name
function getRarityFromA4BName(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes(" ex")) return "double-rare";
  return "common";
}

// ==================== CARD TYPE DETECTION ====================

function detectCardType(name: string): { supertype: string; subtype: string; type: string } {
  const lowerName = name.toLowerCase();
  
  // Check if trainer
  const isTrainerSupporter = TRAINER_SUPPORTERS.some(t => lowerName.includes(t));
  const isTrainerItem = TRAINER_ITEMS.some(t => lowerName.includes(t));
  
  if (isTrainerSupporter) {
    return { supertype: "trainer", subtype: "Supporter", type: "" };
  }
  
  if (isTrainerItem) {
    return { supertype: "trainer", subtype: "Item", type: "" };
  }
  
  // Pokemon detection
  let subtype = "Basic";
  if (lowerName.includes(" ex")) {
    subtype = "ex";
  } else if (lowerName.includes("stage 1") || lowerName.includes("stage1")) {
    subtype = "Stage 1";
  } else if (lowerName.includes("stage 2") || lowerName.includes("stage2")) {
    subtype = "Stage 2";
  }
  
  // Type detection based on Pokemon name (simplified)
  // This is a fallback - actual type would need more detailed data
  return { supertype: "pokemon", subtype, type: "Colorless" };
}

// ==================== IMAGE URL GENERATION ====================

function getLocalImageUrl(setCode: string, localId: string, cardName: string): string {
  const folder = SET_FOLDERS[setCode];
  if (!folder) return "";
  
  let safeName = cardName.replace(/:/g, "_");
  if (setCode !== "A1") {
    safeName = safeName.replace(/'/g, "_");
  }
  
  if (setCode === "A4B") {
    return `/images/cards/${folder}/A4B-${localId}_${safeName}.webp`;
  }
  if (setCode === "B1A") {
    const b1aName = safeName.replace(/ /g, "_");
    return `/images/cards/${folder}/B1A-${localId}_${b1aName}.webp`;
  }
  if (setCode === "P-B") {
    return `/images/cards/${folder}/PROMO-B-${localId}_${safeName}.webp`;
  }
  
  return `/images/cards/${folder}/${localId}_${safeName}.webp`;
}

// ==================== MUTATIONS ====================

export const clearCards = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    for (const card of cards) {
      await ctx.db.delete(card._id);
    }
    return { deleted: cards.length };
  },
});

export const insertCardsBatch = mutation({
  args: {
    cards: v.array(v.object({
      name: v.string(),
      cardNumber: v.string(),
      imageUrl: v.string(),
      packId: v.id("packs"),
      rarityId: v.id("rarities"),
      supertype: v.string(),
      subtype: v.string(),
      type: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    for (const card of args.cards) {
      await ctx.db.insert("cards", card);
    }
    return { inserted: args.cards.length };
  },
});

export const getOrCreateRarities = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRarities = await ctx.db.query("rarities").collect();
    const existingNames = new Set(existingRarities.map(r => r.name));
    
    const allRarities = ["◆", "◆◆", "◆◆◆", "◆◆◆◆", "★", "★★", "★★★", "♛", "Promo"];
    for (const name of allRarities) {
      if (!existingNames.has(name)) {
        await ctx.db.insert("rarities", { name, imageUrl: "" });
      }
    }
    
    const allRaritiesInDb = await ctx.db.query("rarities").collect();
    return allRaritiesInDb.map(r => ({ name: r.name, id: r._id }));
  },
});

export const getPacksBySetCode = mutation({
  args: {},
  handler: async (ctx) => {
    const packs = await ctx.db.query("packs").collect();
    const sets = await ctx.db.query("sets").collect();
    
    // Build setCode -> packId mapping
    const setCodeToPackId: Record<string, Id<"packs">> = {};
    
    for (const set of sets) {
      // Find first pack of this set
      const pack = packs.find(p => p.setId === set._id);
      if (pack) {
        setCodeToPackId[set.setCode] = pack._id;
      }
    }
    
    return { setCodeToPackId, fallbackPackId: packs[0]?._id };
  },
});

// ==================== MAIN SEED ACTION (NO API CALLS) ====================

export const seedAllCards = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; totalCards: number; error?: string }> => {
    // Clear existing cards
    await ctx.runMutation(api.seedCards.clearCards);
    
    // Get rarities
    const raritiesArray = await ctx.runMutation(api.seedCards.getOrCreateRarities);
    const rarityMap = new Map(raritiesArray.map(r => [r.name, r.id]));
    
    // Get packs by setCode
    const { setCodeToPackId, fallbackPackId } = await ctx.runMutation(api.seedCards.getPacksBySetCode);
    
    if (!fallbackPackId) {
      return { success: false, totalCards: 0, error: "No packs found. Run seed sets first." };
    }
    
    const defaultRarityId = rarityMap.get("◆") || raritiesArray[0]?.id;
    let totalCards = 0;
    
    for (const setData of ALL_SETS) {
      const setCode = setData.id;
      
      // Get packId for this set
      const packId = setCodeToPackId[setCode] || fallbackPackId;
      
      // Process cards in batches
      const BATCH_SIZE = 50;
      for (let i = 0; i < setData.cards.length; i += BATCH_SIZE) {
        const batch = setData.cards.slice(i, i + BATCH_SIZE);
        
        const cardsToInsert = batch.map((card) => {
          // Use rarity from JSON data (TCGdex API)
          const rarityName = RARITY_API_MAP[card.rarity || ""] || "◆";
          const rarityId = rarityMap.get(rarityName) || defaultRarityId;
          
          // Use card data from JSON instead of detection
          const supertype = (card.category || "Pokemon").toLowerCase();
          let subtype = card.stage || "Basic";
          // Format stage properly
          if (subtype === "Stage1") subtype = "Stage 1";
          if (subtype === "Stage2") subtype = "Stage 2";
          // Check for ex in name
          if (card.name.toLowerCase().includes(" ex")) {
            subtype = subtype === "Basic" ? "ex" : `${subtype} ex`;
          }
          // Trainer subtype
          if (supertype === "trainer" && card.trainerType) {
            subtype = card.trainerType;
          }
          
          // Use type from JSON
          const type = card.types?.[0] || "";
          
          // Generate image URL
          const imageUrl = getLocalImageUrl(setCode, card.localId, card.name);
          
          return {
            name: card.name,
            cardNumber: card.localId,
            imageUrl,
            packId: packId as Id<"packs">,
            rarityId: rarityId as Id<"rarities">,
            supertype,
            subtype,
            type,
          };
        });
        
        await ctx.runMutation(api.seedCards.insertCardsBatch, { cards: cardsToInsert });
        totalCards += cardsToInsert.length;
      }
    }
    
    return { success: true, totalCards };
  },
});

// Simple seed (same as above, for backward compatibility)
export const seedAllCardsSimple = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing cards
    const existingCards = await ctx.db.query("cards").collect();
    for (const card of existingCards) {
      await ctx.db.delete(card._id);
    }

    // Get rarities
    const rarities = await ctx.db.query("rarities").collect();
    let defaultRarityId: Id<"rarities">;
    if (rarities.length === 0) {
      defaultRarityId = await ctx.db.insert("rarities", { name: "◆", imageUrl: "" });
    } else {
      defaultRarityId = rarities[0]._id;
    }
    const rarityMap = new Map(rarities.map(r => [r.name, r._id]));

    // Get packs and sets
    const packs = await ctx.db.query("packs").collect();
    const sets = await ctx.db.query("sets").collect();
    
    // Build setCode -> packId mapping
    const setCodeToPackId: Record<string, Id<"packs">> = {};
    for (const set of sets) {
      const pack = packs.find(p => p.setId === set._id);
      if (pack) {
        setCodeToPackId[set.setCode] = pack._id;
      }
    }
    
    const fallbackPackId = packs[0]?._id;
    if (!fallbackPackId) {
      return { success: false, error: "No packs found", totalCards: 0 };
    }

    let totalCards = 0;

    for (const setData of ALL_SETS) {
      const setCode = setData.id;
      const packId = setCodeToPackId[setCode] || fallbackPackId;

      for (const card of setData.cards) {
        // Use rarity from JSON data (TCGdex API)
        const rarityName = RARITY_API_MAP[card.rarity || ""] || "◆";
        const rarityId = rarityMap.get(rarityName) || defaultRarityId;
        
        // Use card data from JSON instead of detection
        const supertype = (card.category || "Pokemon").toLowerCase();
        let subtype = card.stage || "Basic";
        if (subtype === "Stage1") subtype = "Stage 1";
        if (subtype === "Stage2") subtype = "Stage 2";
        if (card.name.toLowerCase().includes(" ex")) {
          subtype = subtype === "Basic" ? "ex" : `${subtype} ex`;
        }
        if (supertype === "trainer" && card.trainerType) {
          subtype = card.trainerType;
        }
        
        const type = card.types?.[0] || "";
        const imageUrl = getLocalImageUrl(setCode, card.localId, card.name);

        await ctx.db.insert("cards", {
          name: card.name,
          cardNumber: card.localId,
          imageUrl,
          packId,
          rarityId,
          supertype,
          subtype,
          type,
        });

        totalCards++;
      }
    }

    return { success: true, totalCards };
  },
});
