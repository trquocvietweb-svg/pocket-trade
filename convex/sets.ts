import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============ ADMIN: Cần đếm chính xác packCount và cardCount ============
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxLimit = args.limit || 500;
    const [sets, series, packs, cards] = await Promise.all([
      ctx.db.query("sets").take(maxLimit),
      ctx.db.query("series").take(100),
      ctx.db.query("packs").take(1000),
      ctx.db.query("cards").take(5000), // Reasonable limit for cards
    ]);
    
    const seriesMap = new Map(series.map(s => [s._id, s]));
    
    // Đếm cards per pack
    const cardCountByPack = new Map<string, number>();
    for (const card of cards) {
      const count = cardCountByPack.get(card.packId) ?? 0;
      cardCountByPack.set(card.packId, count + 1);
    }
    
    // Đếm packs và cards per set
    const packCountBySet = new Map<string, number>();
    const cardCountBySet = new Map<string, number>();
    for (const pack of packs) {
      const pCount = packCountBySet.get(pack.setId) ?? 0;
      packCountBySet.set(pack.setId, pCount + 1);
      
      const cCount = cardCountBySet.get(pack.setId) ?? 0;
      const packCards = cardCountByPack.get(pack._id) ?? 0;
      cardCountBySet.set(pack.setId, cCount + packCards);
    }
    
    // Sort by order (nulls last), then by name
    const sortedSets = [...sets].sort((a, b) => {
      const orderA = a.order ?? 9999;
      const orderB = b.order ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
    
    return sortedSets.map(set => {
      const seriesItem = seriesMap.get(set.seriesId);
      return {
        ...set,
        seriesName: seriesItem?.name || "",
        packCount: packCountBySet.get(set._id) ?? 0,
        cardCount: cardCountBySet.get(set._id) ?? 0,
      };
    });
  },
});

export const getById = query({
  args: { id: v.id("sets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    imageUrl: v.string(),
    setCode: v.string(),
    seriesId: v.id("series"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sets", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("sets"),
    name: v.string(),
    imageUrl: v.string(),
    setCode: v.string(),
    seriesId: v.id("series"),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("sets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkRemove = mutation({
  args: { ids: v.array(v.id("sets")) },
  handler: async (ctx, args) => {
    await Promise.all(args.ids.map(id => ctx.db.delete(id)));
    return { deleted: args.ids.length };
  },
});

// ============ Reorder sets ============
export const reorder = mutation({
  args: { 
    orderedIds: v.array(v.id("sets")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { order: i });
    }
    return { success: true };
  },
});
