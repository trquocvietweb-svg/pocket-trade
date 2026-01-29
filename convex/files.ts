import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to get URL for storage");
    
    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      url,
      usedBy: undefined,
      createdAt: Date.now(),
    });
    
    return { fileId, url };
  },
});

export const markFileUsed = mutation({
  args: {
    url: v.string(),
    usedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    
    if (file) {
      await ctx.db.patch(file._id, { usedBy: args.usedBy });
    }
  },
});

export const releaseFile = mutation({
  args: {
    usedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_used_by", (q) => q.eq("usedBy", args.usedBy))
      .collect();
    
    for (const file of files) {
      await ctx.db.patch(file._id, { usedBy: undefined });
    }
  },
});

export const deleteFile = mutation({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    
    if (file) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
    }
  },
});

export const cleanupOrphanFiles = mutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const orphanFiles = await ctx.db
      .query("files")
      .filter((q) => 
        q.and(
          q.eq(q.field("usedBy"), undefined),
          q.lt(q.field("createdAt"), oneHourAgo)
        )
      )
      .collect();
    
    let deleted = 0;
    for (const file of orphanFiles) {
      await ctx.storage.delete(file.storageId);
      await ctx.db.delete(file._id);
      deleted++;
    }
    
    return { deleted };
  },
});

export const getOrphanCount = query({
  args: {},
  handler: async (ctx) => {
    const orphanFiles = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("usedBy"), undefined))
      .collect();
    return orphanFiles.length;
  },
});
