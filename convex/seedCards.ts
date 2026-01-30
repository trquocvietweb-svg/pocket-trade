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
