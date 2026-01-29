import { internalMutation } from "./_generated/server";

// Xóa messages sau 30 ngày
export const cleanupOldMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const oldMessages = await ctx.db
      .query("messages")
      .filter((q) => q.lt(q.field("_creationTime"), thirtyDaysAgo))
      .collect();

    for (const msg of oldMessages) {
      if (msg.contentType === "image" && msg.content.includes("convex.cloud")) {
        const file = await ctx.db
          .query("files")
          .withIndex("by_url", (q) => q.eq("url", msg.content))
          .first();
        if (file) {
          await ctx.storage.delete(file.storageId);
          await ctx.db.delete(file._id);
        }
      }
      await ctx.db.delete(msg._id);
    }
    return { deleted: oldMessages.length };
  },
});

// Đánh dấu trade posts hết hạn
export const cleanupExpiredTradePosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredPosts = await ctx.db
      .query("tradePosts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const post of expiredPosts) {
      await ctx.db.patch(post._id, { status: "expired" });
    }
    return { updated: expiredPosts.length };
  },
});
