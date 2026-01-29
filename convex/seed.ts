import { mutation } from "./_generated/server";

// Pokemon TCG Pocket Sets Data (accurate as of December 2025)
const SERIES_DATA = [
  { name: "A Series" },
  { name: "B Series" },
  { name: "Promo" },
];

// Pack images - local paths (public/images/packs/)
const PACK_IMAGES: Record<string, string> = {
  "Charizard": "/images/packs/charizard.webp",
  "Mewtwo": "/images/packs/mewtwo.webp",
  "Pikachu": "/images/packs/pikachu.webp",
  "Mew": "/images/packs/mew.png",
  "Dialga": "/images/packs/dialga.png",
  "Palkia": "/images/packs/palkia.png",
  "Arceus": "/images/packs/A2a.webp",
  "Shiny Rayquaza": "/images/packs/A2b.webp",
  "Solgaleo": "/images/packs/solgaleo.webp",
  "Lunala": "/images/packs/lunala.webp",
  "Ultra Beast": "/images/packs/A3a.webp",
  "Eevee": "/images/packs/A3b.webp",
  "Ho-Oh": "/images/packs/ho-oh.webp",
  "Lugia": "/images/packs/lugia.webp",
  "Suicune": "/images/packs/A4a.webp",
  "Deluxe ex": "/images/packs/A4B.webp",
  "Mega Altaria": "/images/packs/mega-altaria.webp",
  "Mega Blaziken": "/images/packs/mega-blaziken.webp",
  "Mega Gyarados": "/images/packs/mega-gyarados.webp",
  "Crimson Blaze": "/images/packs/B1A.webp",
  "Promo-A": "/images/packs/promo-a-vol1.webp",
  "Promo-B": "/images/packs/promo-a-vol1.webp",
};

const SETS_DATA = [
  // A Series - Main Sets
  {
    name: "Genetic Apex",
    setCode: "A1",
    seriesName: "A Series",
    imageUrl: "/images/logos/A1.png",
    packs: ["Charizard", "Mewtwo", "Pikachu"],
  },
  {
    name: "Mythical Island",
    setCode: "A1a",
    seriesName: "A Series",
    imageUrl: "/images/logos/A1a.png",
    packs: ["Mew"],
  },
  {
    name: "Space-Time Smackdown",
    setCode: "A2",
    seriesName: "A Series",
    imageUrl: "/images/logos/A2.png",
    packs: ["Dialga", "Palkia"],
  },
  {
    name: "Triumphant Light",
    setCode: "A2a",
    seriesName: "A Series",
    imageUrl: "/images/logos/A2a.png",
    packs: ["Arceus"],
  },
  {
    name: "Shining Revelry",
    setCode: "A2b",
    seriesName: "A Series",
    imageUrl: "/images/logos/A2b.png",
    packs: ["Shiny Rayquaza"],
  },
  {
    name: "Celestial Guardians",
    setCode: "A3",
    seriesName: "A Series",
    imageUrl: "/images/logos/A3.png",
    packs: ["Solgaleo", "Lunala"],
  },
  {
    name: "Extradimensional Crisis",
    setCode: "A3a",
    seriesName: "A Series",
    imageUrl: "/images/logos/A3a.png",
    packs: ["Ultra Beast"],
  },
  {
    name: "Eevee Grove",
    setCode: "A3b",
    seriesName: "A Series",
    imageUrl: "/images/logos/A3b.png",
    packs: ["Eevee"],
  },
  {
    name: "Wisdom of Sea and Sky",
    setCode: "A4",
    seriesName: "A Series",
    imageUrl: "/images/logos/A4.png",
    packs: ["Ho-Oh", "Lugia"],
  },
  {
    name: "Secluded Springs",
    setCode: "A4a",
    seriesName: "A Series",
    imageUrl: "/images/logos/A4a.png",
    packs: ["Suicune"],
  },
  {
    name: "Deluxe Pack ex",
    setCode: "A4B",
    seriesName: "A Series",
    imageUrl: "/images/logos/A4B.webp",
    packs: ["Deluxe ex"],
  },
  // B Series
  {
    name: "Mega Rising",
    setCode: "B1",
    seriesName: "B Series",
    imageUrl: "/images/logos/B1.png",
    packs: ["Mega Altaria", "Mega Blaziken", "Mega Gyarados"],
  },
  {
    name: "Crimson Blaze",
    setCode: "B1A",
    seriesName: "B Series",
    imageUrl: "/images/logos/B1A.webp",
    packs: ["Crimson Blaze"],
  },
  // Promo Sets
  {
    name: "Promo-A",
    setCode: "P-A",
    seriesName: "Promo",
    imageUrl: "/images/logos/P-A.webp",
    packs: ["Promo-A"],
  },
  {
    name: "Promo-B",
    setCode: "P-B",
    seriesName: "Promo",
    imageUrl: "/images/logos/P-B.webp",
    packs: ["Promo-B"],
  },
];

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data
    const existingSeries = await ctx.db.query("series").collect();
    const existingSets = await ctx.db.query("sets").collect();
    const existingPacks = await ctx.db.query("packs").collect();
    
    for (const pack of existingPacks) {
      await ctx.db.delete(pack._id);
    }
    for (const set of existingSets) {
      await ctx.db.delete(set._id);
    }
    for (const series of existingSeries) {
      await ctx.db.delete(series._id);
    }

    // Insert Series
    const seriesMap: Record<string, typeof existingSeries[0]["_id"]> = {};
    for (const series of SERIES_DATA) {
      const id = await ctx.db.insert("series", { name: series.name });
      seriesMap[series.name] = id;
    }

    // Insert Sets and Packs
    for (const setData of SETS_DATA) {
      const seriesId = seriesMap[setData.seriesName];
      if (!seriesId) continue;

      const setId = await ctx.db.insert("sets", {
        name: setData.name,
        setCode: setData.setCode,
        imageUrl: setData.imageUrl,
        seriesId,
      });

      for (const packName of setData.packs) {
        await ctx.db.insert("packs", {
          name: packName,
          setId,
          imageUrl: PACK_IMAGES[packName] || undefined,
        });
      }
    }

    return {
      success: true,
      seriesCount: SERIES_DATA.length,
      setsCount: SETS_DATA.length,
      packsCount: SETS_DATA.reduce((acc, s) => acc + s.packs.length, 0),
    };
  },
});

export const seedSeries = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("series").collect();
    if (existing.length > 0) {
      return { success: false, message: "Series already exist. Clear first." };
    }

    for (const series of SERIES_DATA) {
      await ctx.db.insert("series", { name: series.name });
    }
    return { success: true, count: SERIES_DATA.length };
  },
});
