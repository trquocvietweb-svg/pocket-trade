import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Giới hạn 100 posts để tránh quá tải bandwidth
    return await ctx.db.query("posts").order("desc").take(100);
  },
});

export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getPublished = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    })),
  },
  handler: async (ctx, args) => {
    const limit = args.paginationOpts?.numItems || 20;
    return await ctx.db
      .query("posts")
      .withIndex("by_published_date", (q) => q.eq("isPublished", true))
      .order("desc")
      .paginate(args.paginationOpts || { numItems: limit, cursor: null });
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    markdownContent: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    isMarkdown: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      throw new Error("Slug đã tồn tại");
    }
    return await ctx.db.insert("posts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    markdownContent: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    isMarkdown: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", data.slug))
      .first();
    if (existing && existing._id !== id) {
      throw new Error("Slug đã tồn tại");
    }
    
    const oldPost = await ctx.db.get(id);
    await ctx.db.patch(id, data);
    
    await ctx.scheduler.runAfter(0, internal.posts.cleanupPostImages, {
      postId: id,
      oldContent: oldPost?.content || '',
      newContent: data.content,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (post?.imageUrl?.includes("convex.cloud")) {
      const files = await ctx.db
        .query("files")
        .withIndex("by_used_by", (q) => q.eq("usedBy", `posts:${args.id}`))
        .collect();
      for (const file of files) {
        await ctx.db.patch(file._id, { usedBy: undefined });
      }
    }
    await ctx.db.delete(args.id);
  },
});

export const bulkRemove = mutation({
  args: { ids: v.array(v.id("posts")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const post = await ctx.db.get(id);
      if (post?.imageUrl?.includes("convex.cloud")) {
        const files = await ctx.db
          .query("files")
          .withIndex("by_used_by", (q) => q.eq("usedBy", `posts:${id}`))
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

function extractImageUrls(html: string): string[] {
  const regex = /<img[^>]+src="([^"]+)"/gi;
  const urls: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export const cleanupPostImages = internalMutation({
  args: {
    postId: v.id("posts"),
    oldContent: v.string(),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const oldUrls = extractImageUrls(args.oldContent);
    const newUrls = extractImageUrls(args.newContent);
    
    const removedUrls = oldUrls.filter(url => !newUrls.includes(url) && url.includes('convex.cloud'));
    
    for (const url of removedUrls) {
      const file = await ctx.db
        .query("files")
        .withIndex("by_url", (q) => q.eq("url", url))
        .first();
      
      if (file && file.usedBy === `posts:${args.postId}`) {
        await ctx.db.patch(file._id, { usedBy: undefined });
      }
    }
    
    for (const url of newUrls) {
      if (url.includes('convex.cloud')) {
        const file = await ctx.db
          .query("files")
          .withIndex("by_url", (q) => q.eq("url", url))
          .first();
        
        if (file) {
          await ctx.db.patch(file._id, { usedBy: `posts:${args.postId}` });
        }
      }
    }
  },
});
