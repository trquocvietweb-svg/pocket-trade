import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Import JSON data files
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
import A4B_data from "./data/A4B_data_fixed.json";
import B1_data from "./data/B1_data.json";
import B1A_data from "./data/B1A_data.json";
import PA_data from "./data/P-A_data.json";
import PB_data from "./data/P-B_data.json";

// ==================== SET DEFINITIONS ====================
interface SetDefinition {
  setCode: string;
  name: string;
  seriesName: string;
  logoUrl: string;
  packs: { name: string; imageUrl: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const SETS: SetDefinition[] = [
  {
    setCode: "A1",
    name: "Genetic Apex",
    seriesName: "A Series",
    logoUrl: "/images/logos/A1.png",
    packs: [
      { name: "Charizard", imageUrl: "/images/packs/charizard.webp" },
      { name: "Mewtwo", imageUrl: "/images/packs/mewtwo.webp" },
      { name: "Pikachu", imageUrl: "/images/packs/pikachu.webp" },
    ],
    data: A1_data,
  },
  {
    setCode: "A1a",
    name: "Mythical Island",
    seriesName: "A Series",
    logoUrl: "/images/logos/A1a.png",
    packs: [{ name: "Mew", imageUrl: "/images/packs/mew.png" }],
    data: A1a_data,
  },
  {
    setCode: "A2",
    name: "Space-Time Smackdown",
    seriesName: "A Series",
    logoUrl: "/images/logos/A2.png",
    packs: [
      { name: "Dialga", imageUrl: "/images/packs/dialga.png" },
      { name: "Palkia", imageUrl: "/images/packs/palkia.png" },
    ],
    data: A2_data,
  },
  {
    setCode: "A2a",
    name: "Triumphant Light",
    seriesName: "A Series",
    logoUrl: "/images/logos/A2a.png",
    packs: [{ name: "Arceus", imageUrl: "/images/packs/A2a.webp" }],
    data: A2a_data,
  },
  {
    setCode: "A2b",
    name: "Shining Revelry",
    seriesName: "A Series",
    logoUrl: "/images/logos/A2b.png",
    packs: [{ name: "Shiny Rayquaza", imageUrl: "/images/packs/A2b.webp" }],
    data: A2b_data,
  },
  {
    setCode: "A3",
    name: "Celestial Guardians",
    seriesName: "A Series",
    logoUrl: "/images/logos/A3.png",
    packs: [
      { name: "Solgaleo", imageUrl: "/images/packs/solgaleo.webp" },
      { name: "Lunala", imageUrl: "/images/packs/lunala.webp" },
    ],
    data: A3_data,
  },
  {
    setCode: "A3a",
    name: "Extradimensional Crisis",
    seriesName: "A Series",
    logoUrl: "/images/logos/A3a.png",
    packs: [{ name: "Ultra Beast", imageUrl: "/images/packs/A3a.webp" }],
    data: A3a_data,
  },
  {
    setCode: "A3b",
    name: "Eevee Grove",
    seriesName: "A Series",
    logoUrl: "/images/logos/A3b.png",
    packs: [{ name: "Eevee", imageUrl: "/images/packs/A3b.webp" }],
    data: A3b_data,
  },
  {
    setCode: "A4",
    name: "Wisdom of Sea and Sky",
    seriesName: "A Series",
    logoUrl: "/images/logos/A4.png",
    packs: [
      { name: "Ho-Oh", imageUrl: "/images/packs/ho-oh.webp" },
      { name: "Lugia", imageUrl: "/images/packs/lugia.webp" },
    ],
    data: A4_data,
  },
  {
    setCode: "A4a",
    name: "Secluded Springs",
    seriesName: "A Series",
    logoUrl: "/images/logos/A4a.png",
    packs: [{ name: "Suicune", imageUrl: "/images/packs/A4a.webp" }],
    data: A4a_data,
  },
  {
    setCode: "A4B",
    name: "Deluxe Pack ex",
    seriesName: "A Series",
    logoUrl: "/images/logos/A4B.webp",
    packs: [{ name: "Deluxe ex", imageUrl: "/images/packs/A4B.webp" }],
    data: A4B_data,
  },
  {
    setCode: "B1",
    name: "Mega Rising",
    seriesName: "B Series",
    logoUrl: "/images/logos/B1.png",
    packs: [
      { name: "Mega Altaria", imageUrl: "/images/packs/mega-altaria.webp" },
      { name: "Mega Blaziken", imageUrl: "/images/packs/mega-blaziken.webp" },
      { name: "Mega Gyarados", imageUrl: "/images/packs/mega-gyarados.webp" },
    ],
    data: B1_data,
  },
  {
    setCode: "B1A",
    name: "Crimson Blaze",
    seriesName: "B Series",
    logoUrl: "/images/logos/B1A.webp",
    packs: [{ name: "Crimson Blaze", imageUrl: "/images/packs/B1A.webp" }],
    data: B1A_data,
  },
  {
    setCode: "P-A",
    name: "Promo-A",
    seriesName: "Promo",
    logoUrl: "/images/logos/P-A.webp",
    packs: [{ name: "Promo-A", imageUrl: "/images/packs/promo-a-vol1.webp" }],
    data: PA_data,
  },
  {
    setCode: "P-B",
    name: "Promo-B",
    seriesName: "Promo",
    logoUrl: "/images/logos/P-B.webp",
    packs: [{ name: "Promo-B", imageUrl: "/images/packs/promo-a-vol1.webp" }],
    data: PB_data,
  },
];

// ==================== RARITY MAPPING (TCGdex API format) ====================
// IMPORTANT: Must use symbols that match existing database!
// Database uses: ★ (black star U+2605), ♛ (crown U+265B)
const RARITY_API_MAP: Record<string, string> = {
  // Diamond rarities from TCGdex
  "One Diamond": "◆",
  "Two Diamond": "◆◆",
  "Three Diamond": "◆◆◆",
  "Four Diamond": "◆◆◆◆",
  // Star rarities (TCGdex format) - use BLACK STAR ★
  "One Star": "★",
  "Two Star": "★★",
  "Three Star": "★★★",
  // Crown - use crown symbol ♛
  "Crown": "♛",
  // Promo
  "Promo": "★",
};

// All possible rarities that need to exist in database
const ALL_RARITIES = [
  "◆", "◆◆", "◆◆◆", "◆◆◆◆",  // Diamond rarities
  "★", "★★", "★★★",           // Star rarities (black star)
  "♛",                         // Crown rarity
];

const B1_UNCOMMON_IDS = new Set([
  "009", "012", "024", "026", "029", "034", "040", "042", "047", "054",
  "059", "065", "066", "072", "075", "077", "079", "083", "087", "091",
  "093", "096", "098", "100", "104", "108", "113", "116", "118", "123",
  "127", "129", "131", "133", "140", "142", "144", "146", "150", "153",
  "156", "162", "164", "167", "171", "178", "182", "186", "189", "200",
  "202", "205", "206", "207", "208", "210", "212", "213", "215", "217",
  "218", "219", "220", "221", "222", "223", "224", "225", "226"
]);

const B1_RARE_IDS = new Set([
  "005", "007", "010", "018", "020", "027", "032", "035", "043", "046",
  "051", "055", "057", "067", "069", "070", "080", "084", "088", "105",
  "106", "109", "111", "114", "120", "132", "134", "136", "137", "147",
  "149", "154", "157", "158", "165", "168", "169", "172", "175", "179",
  "187", "192", "194", "197", "203", "214", "216"
]);

const B1_DOUBLE_RARE_IDS = new Set([
  "002", "016", "031", "036", "052", "073", "081", "085", "102", "121",
  "124", "151", "160", "174", "183"
]);

function getRarityKey(localId: string, setCode: string): string {
  const num = parseInt(localId, 10);

  if (setCode === "A1") {
    if (num <= 178) return "common";
    if (num <= 207) return "uncommon";
    if (num <= 226) return "rare";
    if (num <= 253) return "double-rare";
    if (num <= 271) return "art-rare";
    if (num <= 283) return "super-rare";
    if (num <= 285) return "immersive";
    return "crown";
  }

  if (setCode === "A1a") {
    if (num <= 52) return "common";
    if (num <= 62) return "uncommon";
    if (num <= 68) return "rare";
    if (num <= 77) return "double-rare";
    if (num <= 82) return "art-rare";
    if (num <= 84) return "super-rare";
    if (num <= 85) return "immersive";
    return "crown";
  }

  if (setCode === "A2") {
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

  if (setCode === "A2a") {
    if (num <= 56) return "common";
    if (num <= 68) return "uncommon";
    if (num <= 75) return "rare";
    if (num <= 84) return "double-rare";
    if (num <= 91) return "art-rare";
    if (num <= 94) return "super-rare";
    if (num <= 95) return "immersive";
    return "crown";
  }

  if (setCode === "A2b") {
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

  if (setCode === "A3") {
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

  if (setCode === "A4") {
    if (num <= 100) return "common";
    if (num <= 130) return "uncommon";
    if (num <= 161) return "rare";
    if (num <= 190) return "double-rare";
    if (num <= 215) return "art-rare";
    if (num <= 235) return "super-rare";
    if (num <= 239) return "immersive";
    return "crown";
  }

  if (setCode === "A3a" || setCode === "A3b" || setCode === "A4a") {
    if (num <= 55) return "common";
    if (num <= 67) return "uncommon";
    if (num <= 75) return "rare";
    if (num <= 84) return "double-rare";
    if (num <= 90) return "art-rare";
    if (num <= 94) return "super-rare";
    if (num <= 95) return "immersive";
    return "crown";
  }

  if (setCode === "A4B") {
    if (num === 379) return "crown";
    if (num === 376) return "immersive";
    if (num >= 377 && num <= 378) return "super-rare";
    if (num >= 354 && num <= 375) return "super-rare";
    return "common";
  }

  if (setCode === "B1") {
    if (num >= 329) return "crown";
    if (num >= 317 && num <= 328) return "super-rare";
    if (num >= 287 && num <= 316) return "art-rare";
    if (num >= 251 && num <= 286) return "super-rare";
    if (num >= 227 && num <= 250) return "art-rare";
    if (B1_DOUBLE_RARE_IDS.has(localId)) return "double-rare";
    if (B1_RARE_IDS.has(localId)) return "rare";
    if (B1_UNCOMMON_IDS.has(localId)) return "uncommon";
    return "common";
  }

  if (setCode === "B1A") {
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

  if (setCode === "P-A" || setCode === "P-B") {
    return "art-rare";
  }

  return "common";
}

// ==================== CARD TYPE DETECTION ====================
const TRAINER_SUPPORTERS = [
  "professor", "oak", "misty", "brock", "erika", "koga", "blaine", "giovanni",
  "sabrina", "lt. surge", "blue", "red", "leaf", "cyrus", "cynthia", "dawn",
  "lucas", "rowan", "mars", "jupiter", "saturn", "cheren", "bianca", "n",
  "colress", "ghetsis", "skyla", "elesa", "iris", "roxie", "marlon", "burgh",
  "clay", "lenora", "cilan", "chili", "cress", "drayden", "team rocket",
  "pokémon center lady", "pokemon center lady", "iono", "arven", "nemona", "penny",
  "jacq", "clavell", "grusha", "larry", "ryme", "tulip", "brassius", "katy", "kofu",
  "hassel", "poppy", "rika", "geeta", "nurse", "pokémon breeder", "pokemon breeder",
  "lillie", "gladion", "hau", "acerola", "guzma", "lusamine", "sophocles", "mallow",
  "lana", "kiawe", "olivia", "ilima", "molayne", "nanu", "plumeria", "wicke",
  "faba", "burnet", "kahili", "mina", "hapu", "ryuki", "janine", "will", "karen",
  "kali", "leon", "hop", "sonia", "oleana", "gordie", "melony", "raihan", "bea",
  "allister", "opal", "piers", "marnie", "bede", "avery", "klara", "peony",
  "mustard", "honey", "peonia", "shielbert", "sordward"
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

function detectCardType(name: string): { supertype: string; subtype: string; type: string } {
  const lowerName = name.toLowerCase();
  
  // Use word boundary to avoid false matches (e.g., "n" matching "Venusaur")
  if (TRAINER_SUPPORTERS.some(t => new RegExp(`\\b${t}\\b`, 'i').test(lowerName))) {
    return { supertype: "trainer", subtype: "Supporter", type: "" };
  }
  
  if (TRAINER_ITEMS.some(t => new RegExp(`\\b${t}\\b`, 'i').test(lowerName))) {
    return { supertype: "trainer", subtype: "Item", type: "" };
  }
  
  let subtype = "Basic";
  if (lowerName.includes(" ex")) subtype = "ex";
  
  return { supertype: "pokemon", subtype, type: "Colorless" };
}

// ==================== IMAGE URL ====================
const SET_FOLDERS: Record<string, string> = {
  "A1": "Genetic Apex", "A1a": "Mythical Island", "A2": "Space-Time Smackdown",
  "A2a": "Triumphant Light", "A2b": "Shining Revelry", "A3": "Celestial Guardians",
  "A3a": "Extradimensional Crisis", "A3b": "Eevee Grove", "A4": "Wisdom of Sea and Sky",
  "A4a": "Secluded Springs", "A4B": "Deluxe Pack ex", "B1": "Mega Rising",
  "B1A": "Crimson Blaze", "B1a": "Crimson Blaze", "P-A": "Promos-A", "P-B": "Promos-B",
};

function getImageUrl(setCode: string, localId: string, name: string): string {
  const folder = SET_FOLDERS[setCode];
  if (!folder) return "";
  
  let safeName = name.replace(/:/g, "_");
  if (setCode !== "A1") safeName = safeName.replace(/'/g, "_");
  
  if (setCode === "A4B") return `/images/cards/${folder}/A4B-${localId}_${safeName}.webp`;
  if (setCode === "B1A" || setCode === "B1a") {
    // B1A/B1a: replace space and hyphen with underscore
    const b1aName = safeName.replace(/[ -]/g, "_");
    return `/images/cards/${folder}/B1A-${localId}_${b1aName}.webp`;
  }
  if (setCode === "P-B") return `/images/cards/${folder}/PROMO-B-${localId}_${safeName}.webp`;
  
  return `/images/cards/${folder}/${localId}_${safeName}.webp`;
}

// ==================== QUERIES ====================
export const getAvailableSets = query({
  args: {},
  handler: async (ctx) => {
    const existingSets = await ctx.db.query("sets").collect();
    const existingCodes = new Set(existingSets.map(s => s.setCode));
    
    return SETS.map(s => ({
      setCode: s.setCode,
      name: s.name,
      seriesName: s.seriesName,
      cardCount: (s.data.cards?.length || 0) as number,
      isSeeded: existingCodes.has(s.setCode),
    }));
  },
});

// ==================== SEED BY SET ====================
export const seedSet = mutation({
  args: { setCode: v.string() },
  handler: async (ctx, { setCode }) => {
    const setDef = SETS.find(s => s.setCode === setCode);
    if (!setDef) return { success: false, error: "Set not found" };

    // Get or create series
    let series = await ctx.db.query("series")
      .filter(q => q.eq(q.field("name"), setDef.seriesName))
      .first();
    
    if (!series) {
      const seriesId = await ctx.db.insert("series", { name: setDef.seriesName });
      series = { _id: seriesId, name: setDef.seriesName, _creationTime: Date.now() };
    }

    // Check if set exists, delete old data
    const existingSet = await ctx.db.query("sets")
      .filter(q => q.eq(q.field("setCode"), setCode))
      .first();
    
    if (existingSet) {
      // Delete old packs and cards
      const oldPacks = await ctx.db.query("packs")
        .filter(q => q.eq(q.field("setId"), existingSet._id))
        .collect();
      
      for (const pack of oldPacks) {
        const oldCards = await ctx.db.query("cards")
          .filter(q => q.eq(q.field("packId"), pack._id))
          .collect();
        for (const card of oldCards) {
          await ctx.db.delete(card._id);
        }
        await ctx.db.delete(pack._id);
      }
      await ctx.db.delete(existingSet._id);
    }

    // Create set
    const setId = await ctx.db.insert("sets", {
      name: setDef.name,
      setCode: setDef.setCode,
      imageUrl: setDef.logoUrl,
      seriesId: series._id,
    });

    // Create packs
    const packIds: Id<"packs">[] = [];
    for (const packDef of setDef.packs) {
      const packId = await ctx.db.insert("packs", {
        name: packDef.name,
        setId,
        imageUrl: packDef.imageUrl,
      });
      packIds.push(packId);
    }

    // Get rarities
    const rarities = await ctx.db.query("rarities").collect();
    const rarityMap = new Map(rarities.map(r => [r.name, r._id]));
    
    // Ensure all rarities exist (including star and crown)
    for (const rarityName of ALL_RARITIES) {
      if (!rarityMap.has(rarityName)) {
        const id = await ctx.db.insert("rarities", { name: rarityName, imageUrl: "" });
        rarityMap.set(rarityName, id);
      }
    }

    const defaultRarityId = rarityMap.get("◆")!;
    const defaultPackId = packIds[0];

    // Create cards
    const cards = setDef.data.cards || [];
    let cardCount = 0;

    for (const card of cards) {
      // Use rarity from JSON - support both TCGdex format and direct symbols
      let rarityName = "◆";
      if (card.rarity) {
        // If it's a TCGdex format like "One Diamond", map it
        if (RARITY_API_MAP[card.rarity]) {
          rarityName = RARITY_API_MAP[card.rarity];
        } else {
          // Otherwise use it directly (e.g., "◆", "◆◆", "☆", etc.)
          rarityName = card.rarity;
        }
      }
      const rarityId = rarityMap.get(rarityName) || defaultRarityId;
      
      // Use data from JSON instead of detection
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
      const imageUrl = getImageUrl(setCode, card.localId, card.name);

      // Determine pack based on booster (if available)
      let packId = defaultPackId;
      if (card.boosters && card.boosters.length > 0 && packIds.length > 1) {
        const boosterName = card.boosters[0].toLowerCase();
        const packIndex = setDef.packs.findIndex(p => 
          p.name.toLowerCase().includes(boosterName) || boosterName.includes(p.name.toLowerCase())
        );
        if (packIndex >= 0) packId = packIds[packIndex];
      }

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
      cardCount++;
    }

    return { 
      success: true, 
      setName: setDef.name,
      cardCount,
      packCount: packIds.length,
    };
  },
});

// ==================== SEED ALL ====================
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    let totalSets = 0;
    let totalCards = 0;
    let totalPacks = 0;

    // Clear all existing data
    const existingCards = await ctx.db.query("cards").collect();
    for (const c of existingCards) await ctx.db.delete(c._id);
    
    const existingPacks = await ctx.db.query("packs").collect();
    for (const p of existingPacks) await ctx.db.delete(p._id);
    
    const existingSets = await ctx.db.query("sets").collect();
    for (const s of existingSets) await ctx.db.delete(s._id);
    
    const existingSeries = await ctx.db.query("series").collect();
    for (const s of existingSeries) await ctx.db.delete(s._id);

    // Create series
    const seriesMap = new Map<string, Id<"series">>();
    const uniqueSeries = [...new Set(SETS.map(s => s.seriesName))];
    for (const name of uniqueSeries) {
      const id = await ctx.db.insert("series", { name });
      seriesMap.set(name, id);
    }

    // Ensure all rarities exist (including star and crown)
    const rarities = await ctx.db.query("rarities").collect();
    const rarityMap = new Map(rarities.map(r => [r.name, r._id]));
    for (const rarityName of ALL_RARITIES) {
      if (!rarityMap.has(rarityName)) {
        const id = await ctx.db.insert("rarities", { name: rarityName, imageUrl: "" });
        rarityMap.set(rarityName, id);
      }
    }
    const defaultRarityId = rarityMap.get("◆")!;

    // Seed each set
    for (const setDef of SETS) {
      const seriesId = seriesMap.get(setDef.seriesName)!;
      
      const setId = await ctx.db.insert("sets", {
        name: setDef.name,
        setCode: setDef.setCode,
        imageUrl: setDef.logoUrl,
        seriesId,
      });
      totalSets++;

      // Create packs
      const packIds: Id<"packs">[] = [];
      for (const packDef of setDef.packs) {
        const packId = await ctx.db.insert("packs", {
          name: packDef.name,
          setId,
          imageUrl: packDef.imageUrl,
        });
        packIds.push(packId);
        totalPacks++;
      }

      const defaultPackId = packIds[0];
      const cards = setDef.data.cards || [];

      for (const card of cards) {
        // Use rarity from JSON - support both TCGdex format and direct symbols
        let rarityName = "◆";
        if (card.rarity) {
          if (RARITY_API_MAP[card.rarity]) {
            rarityName = RARITY_API_MAP[card.rarity];
          } else {
            rarityName = card.rarity;
          }
        }
        const rarityId = rarityMap.get(rarityName) || defaultRarityId;
        
        // Use data from JSON instead of detection
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
        const imageUrl = getImageUrl(setDef.setCode, card.localId, card.name);

        let packId = defaultPackId;
        if (card.boosters && card.boosters.length > 0 && packIds.length > 1) {
          const boosterName = card.boosters[0].toLowerCase();
          const packIndex = setDef.packs.findIndex(p => 
            p.name.toLowerCase().includes(boosterName) || boosterName.includes(p.name.toLowerCase())
          );
          if (packIndex >= 0) packId = packIds[packIndex];
        }

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

    return { success: true, totalSets, totalPacks, totalCards };
  },
});

// ==================== DELETE SET ====================
export const deleteSet = mutation({
  args: { setCode: v.string() },
  handler: async (ctx, { setCode }) => {
    const set = await ctx.db.query("sets")
      .filter(q => q.eq(q.field("setCode"), setCode))
      .first();
    
    if (!set) return { success: false, error: "Set not found" };

    const packs = await ctx.db.query("packs")
      .filter(q => q.eq(q.field("setId"), set._id))
      .collect();
    
    let deletedCards = 0;
    for (const pack of packs) {
      const cards = await ctx.db.query("cards")
        .filter(q => q.eq(q.field("packId"), pack._id))
        .collect();
      for (const card of cards) {
        await ctx.db.delete(card._id);
        deletedCards++;
      }
      await ctx.db.delete(pack._id);
    }
    
    await ctx.db.delete(set._id);

    return { success: true, deletedCards, deletedPacks: packs.length };
  },
});

// ==================== DELETE ALL ====================
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    for (const c of cards) await ctx.db.delete(c._id);
    
    const packs = await ctx.db.query("packs").collect();
    for (const p of packs) await ctx.db.delete(p._id);
    
    const sets = await ctx.db.query("sets").collect();
    for (const s of sets) await ctx.db.delete(s._id);
    
    const series = await ctx.db.query("series").collect();
    for (const s of series) await ctx.db.delete(s._id);

    return { 
      success: true, 
      deletedCards: cards.length,
      deletedPacks: packs.length,
      deletedSets: sets.length,
      deletedSeries: series.length,
    };
  },
});
