import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    return settings;
  },
});

export const upsert = mutation({
  args: {
    siteName: v.string(),
    logo: v.optional(v.string()),
    favicon: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    seoKeywords: v.optional(v.array(v.string())),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    limitTradePostPerTrader: v.number(),
    limitCardPerPost: v.number(),
    tradePostDurationHours: v.number(),
    limitRequestPerTraderPerDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();
    
    if (existing) {
      // Release old files if images changed
      if (existing.logo && existing.logo !== args.logo) {
        const oldFile = await ctx.db
          .query("files")
          .withIndex("by_url", (q) => q.eq("url", existing.logo!))
          .first();
        if (oldFile) {
          await ctx.storage.delete(oldFile.storageId);
          await ctx.db.delete(oldFile._id);
        }
      }
      
      if (existing.favicon && existing.favicon !== args.favicon) {
        const oldFile = await ctx.db
          .query("files")
          .withIndex("by_url", (q) => q.eq("url", existing.favicon!))
          .first();
        if (oldFile) {
          await ctx.storage.delete(oldFile.storageId);
          await ctx.db.delete(oldFile._id);
        }
      }
      
      await ctx.db.patch(existing._id, args);
      
      // Mark new files as used
      if (args.logo) {
        const logoFile = await ctx.db
          .query("files")
          .withIndex("by_url", (q) => q.eq("url", args.logo!))
          .first();
        if (logoFile) {
          await ctx.db.patch(logoFile._id, { usedBy: `settings:${existing._id}:logo` });
        }
      }
      
      if (args.favicon) {
        const faviconFile = await ctx.db
          .query("files")
          .withIndex("by_url", (q) => q.eq("url", args.favicon!))
          .first();
        if (faviconFile) {
          await ctx.db.patch(faviconFile._id, { usedBy: `settings:${existing._id}:favicon` });
        }
      }
      
      return existing._id;
    } else {
      const id = await ctx.db.insert("settings", args);
      
      // Mark files as used
      if (args.logo) {
        const logoFile = await ctx.db
          .query("files")
          .withIndex("by_url", (q) => q.eq("url", args.logo!))
          .first();
        if (logoFile) {
          await ctx.db.patch(logoFile._id, { usedBy: `settings:${id}:logo` });
        }
      }
      
      if (args.favicon) {
        const faviconFile = await ctx.db
          .query("files")
          .withIndex("by_url", (q) => q.eq("url", args.favicon!))
          .first();
        if (faviconFile) {
          await ctx.db.patch(faviconFile._id, { usedBy: `settings:${id}:favicon` });
        }
      }
      
      return id;
    }
  },
});
