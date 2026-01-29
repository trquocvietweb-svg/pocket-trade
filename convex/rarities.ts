import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxLimit = args?.limit || 100;
    return await ctx.db.query("rarities").take(maxLimit);
  },
});

export const getById = query({
  args: { id: v.id("rarities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rarities", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("rarities"),
    name: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("rarities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkRemove = mutation({
  args: { ids: v.array(v.id("rarities")) },
  handler: async (ctx, args) => {
    await Promise.all(args.ids.map(id => ctx.db.delete(id)));
    return { deleted: args.ids.length };
  },
});

// Pokemon TCG Pocket Rarities Data (images from pokemongohub.net)
const RARITIES_DATA = [
  { name: "◆", imageUrl: "https://pokemongohub.net/wp-content/uploads/2024/12/show.png" },           // One Diamond - Common
  { name: "◆◆", imageUrl: "https://pokemongohub.net/wp-content/uploads/2024/12/show-1.png" },        // Two Diamond - Uncommon
  { name: "◆◆◆", imageUrl: "https://pokemongohub.net/wp-content/uploads/2024/12/show-2.png" },       // Three Diamond - Rare
  { name: "◆◆◆◆", imageUrl: "https://pokemongohub.net/wp-content/uploads/2024/12/show-3.png" },      // Four Diamond - Double Rare (Pokemon EX)
  { name: "★", imageUrl: "https://pokemongohub.net/wp-content/uploads/2024/12/show-4.png" },         // One Star - Art Rare (Full Art)
  { name: "★★", imageUrl: "https://pokemongohub.net/wp-content/uploads/2024/12/show-9.png" },        // Two Star - Super Rare / Special Art Rare
  { name: "★★★", imageUrl: "https://pokemongohub.net/wp-content/uploads/2024/12/show-8.png" },       // Three Star - Immersive Rare
  { name: "♛", imageUrl: "https://pokemongohub.net/wp-content/uploads/2024/12/show-10.png" },        // Crown - Crown Rare (Gold Art)
  { name: "Promo", imageUrl: "" },                                                                    // Promo - no specific image
];

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Xóa dữ liệu cũ
    const existing = await ctx.db.query("rarities").collect();
    await Promise.all(existing.map(rarity => ctx.db.delete(rarity._id)));

    // Thêm dữ liệu mới
    await Promise.all(RARITIES_DATA.map(rarity => ctx.db.insert("rarities", rarity)));

    return {
      success: true,
      count: RARITIES_DATA.length,
    };
  },
});
