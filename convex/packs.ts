import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============ ADMIN: Cần đếm chính xác cardCount ============
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxLimit = args.limit || 500;
    const [packs, sets, cards] = await Promise.all([
      ctx.db.query("packs").take(maxLimit),
      ctx.db.query("sets").take(500),
      ctx.db.query("cards").take(5000), // Reasonable limit for cards
    ]);
    
    const setMap = new Map(sets.map(s => [s._id, s]));
    
    // Đếm cards per pack
    const cardCountByPack = new Map<string, number>();
    for (const card of cards) {
      const count = cardCountByPack.get(card.packId) ?? 0;
      cardCountByPack.set(card.packId, count + 1);
    }
    
    return packs.map(pack => {
      const set = setMap.get(pack.setId);
      return {
        ...pack,
        setName: set?.name || "",
        cardCount: cardCountByPack.get(pack._id) ?? 0,
      };
    });
  },
});

export const getById = query({
  args: { id: v.id("packs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    setId: v.id("sets"),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("packs", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("packs"),
    name: v.string(),
    setId: v.id("sets"),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("packs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkRemove = mutation({
  args: { ids: v.array(v.id("packs")) },
  handler: async (ctx, args) => {
    await Promise.all(args.ids.map(id => ctx.db.delete(id)));
    return { deleted: args.ids.length };
  },
});
