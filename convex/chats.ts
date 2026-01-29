import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============ OPTIMIZED: Chỉ load data liên quan ============
export const listByTrader = query({
  args: { 
    traderId: v.id("traders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxLimit = args.limit || 100;
    // Lấy chats mà trader là host hoặc guest (dùng index)
    const [asHost, asGuest] = await Promise.all([
      ctx.db.query("chats").withIndex("by_host", (q) => q.eq("traderHostId", args.traderId)).take(maxLimit),
      ctx.db.query("chats").withIndex("by_guest", (q) => q.eq("traderGuestId", args.traderId)).take(maxLimit),
    ]);

    const allChats = [...asHost, ...asGuest];
    const uniqueChats = allChats.filter(
      (chat, index, self) => self.findIndex((c) => c._id === chat._id) === index
    );

    if (uniqueChats.length === 0) return [];

    // Chỉ load traders và cards liên quan
    const partnerIds = [...new Set(uniqueChats.map(c => 
      c.traderHostId === args.traderId ? c.traderGuestId : c.traderHostId
    ))];
    const requestIds = [...new Set(uniqueChats.map(c => c.tradeRequestId))];
    
    const [partners, requests] = await Promise.all([
      Promise.all(partnerIds.map(id => ctx.db.get(id))),
      Promise.all(requestIds.map(id => ctx.db.get(id))),
    ]);
    
    const partnerMap = new Map(partners.filter(Boolean).map(t => [t!._id, t!]));
    const requestMap = new Map(requests.filter(Boolean).map(r => [r!._id, r!]));
    
    // Chỉ load cards từ requests
    const cardIds = [...new Set(requests.filter(Boolean).flatMap(r => [r!.offeredCardId, r!.requestedCardId]))];
    const cards = await Promise.all(cardIds.map(id => ctx.db.get(id)));
    const cardMap = new Map(cards.filter(Boolean).map(c => [c!._id, c!]));

    // ============ OPTIMIZED: Batch load messages cho tất cả chats ============
    const chatIds = uniqueChats.map(c => c._id);
    const messagesArrays = await Promise.all(
      chatIds.map(chatId =>
        ctx.db.query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chatId))
          .order("desc")
          .take(100) // Reasonable limit per chat
      )
    );
    const messagesMap = new Map(chatIds.map((id, i) => [id, messagesArrays[i]]));

    const chatsWithDetails = uniqueChats.map((chat) => {
      const messages = messagesMap.get(chat._id) || [];
      const lastMessage = messages[0];
      const unreadCount = messages.filter(
        (m) => !m.isRead && m.senderId !== args.traderId
      ).length;

      // Lấy thông tin partner
      const partnerId = chat.traderHostId === args.traderId ? chat.traderGuestId : chat.traderHostId;
      const partner = partnerMap.get(partnerId);

      // Lấy thông tin trade request và cards
      const request = requestMap.get(chat.tradeRequestId);
      const offeredCard = request ? cardMap.get(request.offeredCardId) : null;
      const requestedCard = request ? cardMap.get(request.requestedCardId) : null;

      return {
        _id: chat._id,
        tradePostId: chat.tradePostId,
        tradeRequestId: chat.tradeRequestId,
        status: chat.status,
        _creationTime: chat._creationTime,
        partner: partner
          ? {
              _id: partner._id,
              name: partner.name,
              avatarUrl: partner.avatarUrl,
              friendCode: partner.friendCode,
              isOnline: partner.isOnline,
              tradePoint: partner.tradePoint ?? 0,
            }
          : null,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              contentType: lastMessage.contentType,
              senderId: lastMessage.senderId,
              _creationTime: lastMessage._creationTime,
            }
          : null,
        unreadCount,
        tradePreview: {
          offeredCard: offeredCard
            ? { name: offeredCard.name, imageUrl: offeredCard.imageUrl }
            : null,
          requestedCard: requestedCard
            ? { name: requestedCard.name, imageUrl: requestedCard.imageUrl }
            : null,
        },
      };
    });

    // Sort by last message time
    return chatsWithDetails.sort((a, b) => {
      const timeA = a.lastMessage?._creationTime ?? a._creationTime;
      const timeB = b.lastMessage?._creationTime ?? b._creationTime;
      return timeB - timeA;
    });
  },
});

// ============ OPTIMIZED: Chỉ load data liên quan ============
export const getById = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;

    // Chỉ load 2 traders liên quan
    const [host, guest, request] = await Promise.all([
      ctx.db.get(chat.traderHostId),
      ctx.db.get(chat.traderGuestId),
      ctx.db.get(chat.tradeRequestId),
    ]);

    // Chỉ load 2 cards liên quan
    const [offeredCard, requestedCard] = request 
      ? await Promise.all([
          ctx.db.get(request.offeredCardId),
          ctx.db.get(request.requestedCardId),
        ])
      : [null, null];

    return {
      ...chat,
      host: host
        ? {
            _id: host._id,
            name: host.name,
            avatarUrl: host.avatarUrl,
            friendCode: host.friendCode,
            isOnline: host.isOnline,
            tradePoint: host.tradePoint ?? 0,
          }
        : null,
      guest: guest
        ? {
            _id: guest._id,
            name: guest.name,
            avatarUrl: guest.avatarUrl,
            friendCode: guest.friendCode,
            isOnline: guest.isOnline,
            tradePoint: guest.tradePoint ?? 0,
          }
        : null,
      tradePreview: {
        offeredCard: offeredCard
          ? { _id: offeredCard._id, name: offeredCard.name, imageUrl: offeredCard.imageUrl }
          : null,
        requestedCard: requestedCard
          ? { _id: requestedCard._id, name: requestedCard.name, imageUrl: requestedCard.imageUrl }
          : null,
      },
    };
  },
});

// Cập nhật status chat
export const updateStatus = mutation({
  args: {
    chatId: v.id("chats"),
    status: v.string(),
    traderId: v.id("traders"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat không tồn tại");

    // Chỉ host hoặc guest mới có thể cập nhật
    if (chat.traderHostId !== args.traderId && chat.traderGuestId !== args.traderId) {
      throw new Error("Bạn không có quyền thực hiện hành động này");
    }

    const oldStatus = chat.status;
    await ctx.db.patch(args.chatId, { status: args.status });

    // Nếu completed (giao dịch thành công), +1 tradePoint cho cả 2
    if (args.status === "completed" && oldStatus !== "completed") {
      const host = await ctx.db.get(chat.traderHostId);
      const guest = await ctx.db.get(chat.traderGuestId);

      if (host) {
        await ctx.db.patch(chat.traderHostId, {
          tradePoint: (host.tradePoint ?? 0) + 1,
        });
      }
      if (guest) {
        await ctx.db.patch(chat.traderGuestId, {
          tradePoint: (guest.tradePoint ?? 0) + 1,
        });
      }
    }
  },
});

// Xác nhận chốt giao dịch (cần cả 2 bên)
export const confirmTrade = mutation({
  args: {
    chatId: v.id("chats"),
    traderId: v.id("traders"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat không tồn tại");

    const isHost = chat.traderHostId === args.traderId;
    const isGuest = chat.traderGuestId === args.traderId;

    if (!isHost && !isGuest) {
      throw new Error("Bạn không có quyền thực hiện hành động này");
    }

    if (chat.status !== "active") {
      throw new Error("Giao dịch đã kết thúc");
    }

    // Cập nhật confirm của người này
    const update: { hostConfirmed?: boolean; guestConfirmed?: boolean } = {};
    if (isHost) update.hostConfirmed = true;
    if (isGuest) update.guestConfirmed = true;

    await ctx.db.patch(args.chatId, update);

    // Kiểm tra nếu cả 2 đã confirm
    const newHostConfirmed = isHost ? true : chat.hostConfirmed;
    const newGuestConfirmed = isGuest ? true : chat.guestConfirmed;

    if (newHostConfirmed && newGuestConfirmed) {
      // Cả 2 đã chốt -> hoàn thành giao dịch
      await ctx.db.patch(args.chatId, { status: "completed" });

      // +1 tradePoint cho cả 2
      const host = await ctx.db.get(chat.traderHostId);
      const guest = await ctx.db.get(chat.traderGuestId);

      if (host) {
        await ctx.db.patch(chat.traderHostId, {
          tradePoint: (host.tradePoint ?? 0) + 1,
        });
      }
      if (guest) {
        await ctx.db.patch(chat.traderGuestId, {
          tradePoint: (guest.tradePoint ?? 0) + 1,
        });
      }

      return { completed: true };
    }

    return { confirmed: true, waitingForOther: true };
  },
});

// Hủy xác nhận (nếu chưa complete)
export const unconfirmTrade = mutation({
  args: {
    chatId: v.id("chats"),
    traderId: v.id("traders"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat không tồn tại");

    const isHost = chat.traderHostId === args.traderId;
    const isGuest = chat.traderGuestId === args.traderId;

    if (!isHost && !isGuest) {
      throw new Error("Bạn không có quyền thực hiện hành động này");
    }

    if (chat.status !== "active") {
      throw new Error("Giao dịch đã kết thúc");
    }

    // Hủy confirm của người này
    if (isHost) await ctx.db.patch(args.chatId, { hostConfirmed: false });
    if (isGuest) await ctx.db.patch(args.chatId, { guestConfirmed: false });

    return { success: true };
  },
});

// Hủy giao dịch (đơn phương)
export const cancelTrade = mutation({
  args: {
    chatId: v.id("chats"),
    traderId: v.id("traders"),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat không tồn tại");

    if (chat.traderHostId !== args.traderId && chat.traderGuestId !== args.traderId) {
      throw new Error("Bạn không có quyền thực hiện hành động này");
    }

    if (chat.status !== "active") {
      throw new Error("Giao dịch đã kết thúc");
    }

    await ctx.db.patch(args.chatId, { 
      status: "cancelled",
      cancelledBy: args.traderId,
    });
    
    return { success: true };
  },
});

// Giữ lại cho backward compatibility
export const complete = confirmTrade;
export const cancel = cancelTrade;
