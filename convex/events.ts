import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Giới hạn 50 events để tránh quá tải bandwidth
    return await ctx.db.query("events").order("desc").take(50);
  },
});

export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Nếu isActive = true, tắt tất cả event khác
    if (args.isActive) {
      const activeEvents = await ctx.db
        .query("events")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
      for (const event of activeEvents) {
        await ctx.db.patch(event._id, { isActive: false });
      }
    }
    return await ctx.db.insert("events", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("events"),
    name: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    // Nếu isActive = true, tắt tất cả event khác
    if (data.isActive) {
      const activeEvents = await ctx.db
        .query("events")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
      for (const event of activeEvents) {
        if (event._id !== id) {
          await ctx.db.patch(event._id, { isActive: false });
        }
      }
    }
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (event?.imageUrl?.includes('convex.cloud')) {
      // Release file when deleting event
      const files = await ctx.db
        .query("files")
        .withIndex("by_used_by", (q) => q.eq("usedBy", `events:${args.id}`))
        .collect();
      for (const file of files) {
        await ctx.db.patch(file._id, { usedBy: undefined });
      }
    }
    await ctx.db.delete(args.id);
  },
});

export const bulkRemove = mutation({
  args: { ids: v.array(v.id("events")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const event = await ctx.db.get(id);
      if (event?.imageUrl?.includes('convex.cloud')) {
        const files = await ctx.db
          .query("files")
          .withIndex("by_used_by", (q) => q.eq("usedBy", `events:${id}`))
          .collect();
        for (const file of files) {
          await ctx.db.patch(file._id, { usedBy: undefined });
        }
      }
      await ctx.db.delete(id);
    }
    return { deleted: args.ids.length };
  },
});

export const getActiveEvent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Filter: isActive = true AND startDate <= now <= endDate
    const event = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    
    if (!event) return null;
    
    // Client-side date validation để tránh query không cần thiết
    if (event.startDate > now || event.endDate < now) {
      return null;
    }
    
    // Chỉ trả về fields cần thiết để tiết kiệm bandwidth
    return {
      _id: event._id,
      name: event.name,
      imageUrl: event.imageUrl,
      startDate: event.startDate,
      endDate: event.endDate,
    };
  },
});
