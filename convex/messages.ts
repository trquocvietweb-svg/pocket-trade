import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============ OPTIMIZED: Chỉ load traders liên quan ============
export const listByChat = query({
  args: { 
    chatId: v.id("chats"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxLimit = args.limit || 500; // Reasonable limit for messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .take(maxLimit);

    if (messages.length === 0) return [];

    // Chỉ load traders liên quan (thay vì ALL traders!)
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const tradersRaw = await Promise.all(senderIds.map(id => ctx.db.get(id)));
    const traderMap = new Map(tradersRaw.filter(Boolean).map(t => [t!._id, t!]));

    return messages.map((msg) => {
      const sender = traderMap.get(msg.senderId);
      return {
        ...msg,
        senderName: sender?.name ?? "",
        senderAvatar: sender?.avatarUrl ?? "",
      };
    });
  },
});

// Gửi message
export const send = mutation({
  args: {
    chatId: v.id("chats"),
    senderId: v.id("traders"),
    content: v.string(),
    contentType: v.string(), // "text" | "image"
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat không tồn tại");

    // Kiểm tra sender có trong chat không
    if (chat.traderHostId !== args.senderId && chat.traderGuestId !== args.senderId) {
      throw new Error("Bạn không có quyền gửi tin nhắn trong chat này");
    }

    // Kiểm tra chat còn active không
    if (chat.status !== "active") {
      throw new Error("Chat đã kết thúc, không thể gửi tin nhắn");
    }

    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: args.senderId,
      content: args.content,
      contentType: args.contentType,
      isRead: false,
    });
  },
});

// Đánh dấu đã đọc
export const markAsRead = mutation({
  args: {
    chatId: v.id("chats"),
    traderId: v.id("traders"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .take(500); // Reasonable limit

    // Batch update: Đánh dấu đã đọc các tin nhắn từ người khác
    const messagesToUpdate = messages.filter(
      msg => msg.senderId !== args.traderId && !msg.isRead
    );
    
    await Promise.all(
      messagesToUpdate.map(msg => ctx.db.patch(msg._id, { isRead: true }))
    );
  },
});

// ============ OPTIMIZED: Batch load messages thay vì N+1 ============
export const countUnread = query({
  args: { traderId: v.id("traders") },
  handler: async (ctx, args) => {
    // Lấy tất cả chats của trader (với limit)
    const [asHost, asGuest] = await Promise.all([
      ctx.db.query("chats").withIndex("by_host", (q) => q.eq("traderHostId", args.traderId)).take(100),
      ctx.db.query("chats").withIndex("by_guest", (q) => q.eq("traderGuestId", args.traderId)).take(100),
    ]);

    const allChats = [...asHost, ...asGuest];
    const uniqueChatIds = [...new Set(allChats.map((c) => c._id))];

    if (uniqueChatIds.length === 0) return 0;

    // BATCH LOAD: Lấy messages của TẤT CẢ chats cùng lúc
    const messagesArrays = await Promise.all(
      uniqueChatIds.map(chatId =>
        ctx.db.query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .take(200) // Reasonable limit per chat
      )
    );

    // Đếm unread từ tất cả messages
    let totalUnread = 0;
    for (const messages of messagesArrays) {
      totalUnread += messages.filter(
        (m) => !m.isRead && m.senderId !== args.traderId
      ).length;
    }

    return totalUnread;
  },
});
