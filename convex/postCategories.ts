import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List all categories
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query("postCategories").order("desc");
    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.take(100); // Default limit 100
  },
});

// List all categories with post count
export const listWithCount = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxLimit = args.limit || 100;
    const categories = await ctx.db
      .query("postCategories")
      .order("desc")
      .take(maxLimit);
    
    // Get all pivots for these categories in one batch
    const categoryIds = categories.map(c => c._id);
    const allPivots = await ctx.db
      .query("postCategoryPivot")
      .collect();
    
    // Group pivots by category
    const pivotsByCategory = new Map<Id<"postCategories">, typeof allPivots>();
    for (const pivot of allPivots) {
      if (categoryIds.includes(pivot.categoryId)) {
        if (!pivotsByCategory.has(pivot.categoryId)) {
          pivotsByCategory.set(pivot.categoryId, []);
        }
        pivotsByCategory.get(pivot.categoryId)!.push(pivot);
      }
    }
    
    // Batch fetch all posts
    const allPostIds = [...new Set(allPivots.map(p => p.postId))];
    const postsRaw = await Promise.all(allPostIds.map(id => ctx.db.get(id)));
    const postsMap = new Map(postsRaw.filter(Boolean).map(p => [p!._id, p!]));
    
    // Calculate counts
    const categoriesWithCount = categories.map((cat) => {
      const pivots = pivotsByCategory.get(cat._id) || [];
      const publishedCount = pivots.filter(pivot => {
        const post = postsMap.get(pivot.postId);
        return post?.isPublished;
      }).length;
      
      return {
        ...cat,
        postsCount: publishedCount,
      };
    });
    
    return categoriesWithCount;
  },
});

// Get by ID
export const getById = query({
  args: { id: v.id("postCategories") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Get by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("postCategories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

// Create category
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    // Auto-generate slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Check slug unique
    const existing = await ctx.db
      .query("postCategories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      throw new Error("Tên danh mục đã tồn tại (slug trùng)");
    }
    
    return await ctx.db.insert("postCategories", { name, slug });
  },
});

// Update category
export const update = mutation({
  args: {
    id: v.id("postCategories"),
    name: v.string(),
  },
  handler: async (ctx, { id, name }) => {
    // Auto-generate slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Check slug unique (except current)
    const existing = await ctx.db
      .query("postCategories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing && existing._id !== id) {
      throw new Error("Tên danh mục đã tồn tại (slug trùng)");
    }
    
    await ctx.db.patch(id, { name, slug });
  },
});

// Remove category
export const remove = mutation({
  args: { id: v.id("postCategories") },
  handler: async (ctx, { id }) => {
    // Remove all pivot records
    const pivots = await ctx.db
      .query("postCategoryPivot")
      .withIndex("by_category", (q) => q.eq("categoryId", id))
      .collect();
    
    // Batch delete pivots
    await Promise.all(pivots.map(pivot => ctx.db.delete(pivot._id)));
    
    await ctx.db.delete(id);
  },
});

// Bulk remove
export const bulkRemove = mutation({
  args: { ids: v.array(v.id("postCategories")) },
  handler: async (ctx, { ids }) => {
    // Get all pivots for all categories in one query
    const allPivots = await ctx.db.query("postCategoryPivot").collect();
    const pivotsToDelete = allPivots.filter(p => ids.includes(p.categoryId));
    
    // Batch delete all pivots and categories
    await Promise.all([
      ...pivotsToDelete.map(pivot => ctx.db.delete(pivot._id)),
      ...ids.map(id => ctx.db.delete(id))
    ]);
  },
});

// Get categories for a post
export const getPostCategories = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const pivots = await ctx.db
      .query("postCategoryPivot")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    
    // Batch fetch categories
    const categoryIds = pivots.map(p => p.categoryId);
    const categories = await Promise.all(categoryIds.map(id => ctx.db.get(id)));
    
    return categories.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

// Sync post categories (replace all)
export const syncPostCategories = mutation({
  args: {
    postId: v.id("posts"),
    categoryIds: v.array(v.id("postCategories")),
  },
  handler: async (ctx, { postId, categoryIds }) => {
    // Remove existing
    const existing = await ctx.db
      .query("postCategoryPivot")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    
    // Batch operations
    await Promise.all([
      ...existing.map(pivot => ctx.db.delete(pivot._id)),
      ...categoryIds.map(categoryId => 
        ctx.db.insert("postCategoryPivot", { postId, categoryId })
      )
    ]);
  },
});

// Get posts in category (for edit page)
export const getPostsInCategory = query({
  args: { 
    categoryId: v.id("postCategories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { categoryId, limit }) => {
    const maxLimit = limit || 100;
    const pivots = await ctx.db
      .query("postCategoryPivot")
      .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
      .take(maxLimit);
    
    // Batch fetch posts
    const postIds = pivots.map(p => p.postId);
    const posts = await Promise.all(postIds.map(id => ctx.db.get(id)));
    
    return posts.filter((p): p is NonNullable<typeof p> => p !== null);
  },
});

// Remove post from category
export const removePostFromCategory = mutation({
  args: {
    postId: v.id("posts"),
    categoryId: v.id("postCategories"),
  },
  handler: async (ctx, { postId, categoryId }) => {
    const pivot = await ctx.db
      .query("postCategoryPivot")
      .withIndex("by_post_category", (q) => 
        q.eq("postId", postId).eq("categoryId", categoryId)
      )
      .first();
    
    if (pivot) {
      await ctx.db.delete(pivot._id);
    }
  },
});
// Get posts by category (for public page) - returns all posts in category
export const getPostsByCategory = query({
  args: { 
    categoryId: v.id("postCategories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { categoryId, limit }) => {
    const maxLimit = limit || 100;
    const pivots = await ctx.db
      .query("postCategoryPivot")
      .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
      .take(maxLimit);
    
    // Batch fetch posts
    const postIds = pivots.map(p => p.postId);
    const posts = await Promise.all(postIds.map(id => ctx.db.get(id)));
    
    // Filter published and sort by date desc
    const published = posts
      .filter((p): p is NonNullable<typeof p> => p !== null && p.isPublished)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return published;
  },
});
