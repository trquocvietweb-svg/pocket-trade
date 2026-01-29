import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Rarity order for sorting
const RARITY_ORDER: Record<string, number> = {
  '◆': 1, '◆◆': 2, '◆◆◆': 3, '◆◆◆◆': 4,
  '☆': 5, '☆☆': 6, '☆☆☆': 7,
  '♢': 8, 'Shiny Rare': 9, 'Shiny Super Rare': 10, 'Crown Rare': 11,
};

// ============ OPTIMIZED: Tách query lấy filter options (gọi 1 lần, cache client) ============
export const getFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    const [rarities, packs, sets] = await Promise.all([
      ctx.db.query("rarities").collect(),
      ctx.db.query("packs").collect(),
      ctx.db.query("sets").collect(),
    ]);
    
    // Build collections list - sort by order field
    const sortedSets = [...sets].sort((a, b) => {
      const orderA = a.order ?? 9999;
      const orderB = b.order ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
    const collections = sortedSets.map(s => s.name);
    
    // Build rarities list sorted
    const rarityNames = rarities.map(r => r.name);
    rarityNames.sort((a, b) => (RARITY_ORDER[a] || 0) - (RARITY_ORDER[b] || 0));
    
    // Build lookup maps for client-side enrichment
    const rarityMap = Object.fromEntries(rarities.map(r => [r._id, { name: r.name, imageUrl: r.imageUrl }]));
    const packMap = Object.fromEntries(packs.map(p => [p._id, { name: p.name, setId: p.setId }]));
    const setMap = Object.fromEntries(sets.map(s => [s._id, { name: s.name, setCode: s.setCode }]));
    
    return { collections, rarities: rarityNames, rarityMap, packMap, setMap };
  },
});

// ============ OPTIMIZED: Load all để có total đúng, chỉ enrich page hiện tại ============
export const listPaginated = query({
  args: { 
    limit: v.number(),
    page: v.optional(v.number()),
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    collection: v.optional(v.string()),
    cardType: v.optional(v.string()),
    rarity: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortDir: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Load metadata (small tables, OK to collect - cached)
    const [rarities, packs, sets] = await Promise.all([
      ctx.db.query("rarities").collect(),
      ctx.db.query("packs").collect(),
      ctx.db.query("sets").collect(),
    ]);
    
    // Build lookup maps
    const rarityMap = new Map(rarities.map(r => [r._id, r]));
    const packMap = new Map(packs.map(p => [p._id, p]));
    const setMap = new Map(sets.map(s => [s._id, s]));
    const setByName = new Map(sets.map(s => [s.name, s]));
    
    // Find rarityId if filtering by rarity name
    let filterRarityId: Id<"rarities"> | null = null;
    if (args.rarity && args.rarity !== "All") {
      const found = rarities.find(r => r.name === args.rarity);
      if (found) filterRarityId = found._id;
    }
    
    // Find packIds if filtering by collection (set name)
    let filterPackIds: Set<Id<"packs">> | null = null;
    if (args.collection && args.collection !== "All") {
      const targetSet = setByName.get(args.collection);
      if (targetSet) {
        filterPackIds = new Set(
          packs.filter(p => p.setId === targetSet._id).map(p => p._id)
        );
      }
    }
    
    // ============ Load ALL cards để có total count đúng ============
    let rawCards;
    if (filterRarityId) {
      rawCards = await ctx.db.query("cards")
        .withIndex("by_rarity", q => q.eq("rarityId", filterRarityId!))
        .collect();
    } else if (filterPackIds && filterPackIds.size === 1) {
      const packId = [...filterPackIds][0];
      rawCards = await ctx.db.query("cards")
        .withIndex("by_pack", q => q.eq("packId", packId))
        .collect();
    } else if (args.cardType && args.cardType !== "All") {
      rawCards = await ctx.db.query("cards")
        .withIndex("by_type", q => q.eq("type", args.cardType!))
        .collect();
    } else {
      rawCards = await ctx.db.query("cards").collect();
    }
    
    // Apply remaining filters in JS
    const searchLower = (args.search || "").toLowerCase();
    
    const filtered = rawCards.filter(card => {
      // Search filter
      if (args.search && searchLower) {
        const nameMatch = card.name.toLowerCase().includes(searchLower);
        const typeMatch = card.type.toLowerCase().includes(searchLower);
        if (!nameMatch && !typeMatch) return false;
      }
      
      // Category filter
      if (args.category && args.category !== "All") {
        const isPokemon = card.supertype === "pokemon";
        if (args.category === "Pokemon" && !isPokemon) return false;
        if (args.category !== "Pokemon" && isPokemon) return false;
      }
      
      // Collection filter (by packId) - only if not already filtered by index
      if (filterPackIds && filterPackIds.size > 1 && !filterPackIds.has(card.packId)) return false;
      
      // Type filter - only if not already filtered by index
      if (args.cardType && args.cardType !== "All" && !filterRarityId && !(filterPackIds && filterPackIds.size === 1)) {
        // Already filtered by index, skip
      } else if (args.cardType && args.cardType !== "All" && card.type !== args.cardType) {
        return false;
      }
      
      return true;
    });
    
    // Lấy total TRƯỚC khi paginate
    const total = filtered.length;
    
    // Sort trước khi paginate (sort trên raw data, chưa enrich)
    const sortBy = args.sortBy || "ID";
    const sortDir = args.sortDir || "ASC";
    
    // Pre-compute sort helpers
    const getRarityOrder = (card: typeof filtered[0]) => {
      const rarity = rarityMap.get(card.rarityId);
      return RARITY_ORDER[rarity?.name || ""] || 0;
    };
    const getSetCode = (card: typeof filtered[0]) => {
      const pack = packMap.get(card.packId);
      const set = pack ? setMap.get(pack.setId) : undefined;
      return set?.setCode || "";
    };
    
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "NAME": cmp = a.name.localeCompare(b.name); break;
        case "TYPE": cmp = a.type.localeCompare(b.type); break;
        case "RARITY": cmp = getRarityOrder(a) - getRarityOrder(b); break;
        default:
          cmp = getSetCode(b).localeCompare(getSetCode(a));
          if (cmp === 0) cmp = (parseInt(a.cardNumber) || 0) - (parseInt(b.cardNumber) || 0);
      }
      return sortDir === "ASC" ? cmp : -cmp;
    });
    
    // Paginate TRƯỚC khi enrich (chỉ enrich page hiện tại)
    const page = args.page || 1;
    const startIndex = (page - 1) * args.limit;
    const pageCards = filtered.slice(startIndex, startIndex + args.limit);
    const totalPages = Math.ceil(total / args.limit);
    
    // Enrich CHỈ cards trong page hiện tại
    const items = pageCards.map(card => {
      const rarity = rarityMap.get(card.rarityId);
      const pack = packMap.get(card.packId);
      const set = pack ? setMap.get(pack.setId) : undefined;
      return {
        ...card,
        rarityName: rarity?.name || "",
        rarityOrder: RARITY_ORDER[rarity?.name || ""] || 0,
        packName: pack?.name || "",
        setName: set?.name || "",
        setCode: set?.setCode || "",
      };
    });
    
    // Return filter options from metadata (already loaded)
    // Sort sets by order field, then by name
    const sortedSets = [...sets].sort((a, b) => {
      const orderA = a.order ?? 9999;
      const orderB = b.order ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
    const collections = sortedSets.map(s => s.name);
    const rarityNames = rarities.map(r => r.name).sort((a, b) => (RARITY_ORDER[a] || 0) - (RARITY_ORDER[b] || 0));
    
    return { 
      items, 
      total, 
      totalPages, 
      currentPage: page,
      collections, 
      rarities: rarityNames 
    };
  },
});

// ============ ADMIN: Cần ALL cards để quản lý ============
export const list = query({
  args: {},
  handler: async (ctx) => {
    const [cards, rarities, packs, sets] = await Promise.all([
      ctx.db.query("cards").collect(),
      ctx.db.query("rarities").collect(),
      ctx.db.query("packs").collect(),
      ctx.db.query("sets").collect(),
    ]);
    
    const rarityMap = new Map(rarities.map(r => [r._id, r]));
    const packMap = new Map(packs.map(p => [p._id, p]));
    const setMap = new Map(sets.map(s => [s._id, s]));
    
    return cards.map(card => {
      const rarity = rarityMap.get(card.rarityId);
      const pack = packMap.get(card.packId);
      const set = pack ? setMap.get(pack.setId) : undefined;
      return {
        ...card,
        rarityName: rarity?.name || "",
        rarityImageUrl: rarity?.imageUrl || "",
        packName: pack?.name || "",
        setName: set?.name || "",
        setCode: set?.setCode || "",
      };
    });
  },
});

export const getById = query({
  args: { id: v.id("cards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByIdEnriched = query({
  args: { id: v.id("cards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.id);
    if (!card) return null;
    
    const rarity = card.rarityId ? await ctx.db.get(card.rarityId) : null;
    const pack = card.packId ? await ctx.db.get(card.packId) : null;
    const set = pack?.setId ? await ctx.db.get(pack.setId) : null;
    
    return {
      ...card,
      rarityName: rarity?.name || "",
      rarityImageUrl: rarity?.imageUrl || "",
      packName: pack?.name || "",
      setName: set?.name || "",
      setCode: set?.setCode || "",
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    rarityId: v.id("rarities"),
    supertype: v.string(),
    subtype: v.string(),
    type: v.optional(v.string()),
    packId: v.id("packs"),
    cardNumber: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cards", { ...args, type: args.type || "" });
  },
});

export const update = mutation({
  args: {
    id: v.id("cards"),
    name: v.string(),
    rarityId: v.id("rarities"),
    supertype: v.string(),
    subtype: v.string(),
    type: v.optional(v.string()),
    packId: v.id("packs"),
    cardNumber: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, { ...data, type: data.type || "" });
  },
});

export const remove = mutation({
  args: { id: v.id("cards") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkRemove = mutation({
  args: { ids: v.array(v.id("cards")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
    return { deleted: args.ids.length };
  },
});

// ============ ADMIN: Lấy cards theo pack name (để debug/fix data) ============
export const listByPackName = query({
  args: { packName: v.string() },
  handler: async (ctx, args) => {
    const packs = await ctx.db.query("packs").collect();
    const pack = packs.find(p => p.name === args.packName);
    if (!pack) return { error: `Pack "${args.packName}" không tồn tại`, cards: [] };
    
    const cards = await ctx.db.query("cards")
      .withIndex("by_pack", q => q.eq("packId", pack._id))
      .collect();
    
    const rarities = await ctx.db.query("rarities").collect();
    const rarityMap = new Map(rarities.map(r => [r._id, r.name]));
    
    return {
      packId: pack._id,
      packName: pack.name,
      totalCards: cards.length,
      cards: cards.map(c => ({
        _id: c._id,
        name: c.name,
        type: c.type,
        rarityName: rarityMap.get(c.rarityId) || "",
        cardNumber: c.cardNumber,
      })),
    };
  },
});

// ============ ADMIN: Bulk update cards (fix type/rarity) ============
export const bulkUpdateCards = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("cards"),
      type: v.optional(v.string()),
      rarityId: v.optional(v.id("rarities")),
    })),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const item of args.updates) {
      const updateData: { type?: string; rarityId?: Id<"rarities"> } = {};
      if (item.type !== undefined) updateData.type = item.type;
      if (item.rarityId !== undefined) updateData.rarityId = item.rarityId;
      
      if (Object.keys(updateData).length > 0) {
        await ctx.db.patch(item.id, updateData);
        updated++;
      }
    }
    return { updated };
  },
});
