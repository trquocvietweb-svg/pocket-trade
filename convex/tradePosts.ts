import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============ OPTIMIZED: Đếm posts trong ngày - take thay collect ============
export const countTodayPosts = query({
  args: { traderId: v.id("traders") },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0).getTime();
    
    // Chỉ lấy recent posts, không ai đăng 50 posts/ngày
    const recentPosts = await ctx.db
      .query("tradePosts")
      .withIndex("by_trader", q => q.eq("traderId", args.traderId))
      .order("desc")
      .take(50);
    
    return recentPosts.filter(p => p._creationTime >= startOfDay).length;
  },
});

// ============ OPTIMIZED: Tách query filter options ============
export const getFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    const [rarities, sets] = await Promise.all([
      ctx.db.query("rarities").collect(),
      ctx.db.query("sets").collect(),
    ]);
    return {
      rarities: rarities.map(r => r.name).sort(),
      sets: sets.map(s => s.name).sort(),
    };
  },
});

// ============ ADMIN: Giới hạn 100 posts, dùng cho admin panel ============
export const list = query({
  args: {},
  handler: async (ctx) => {
    // Giới hạn 100 posts gần nhất để tránh quá tải bandwidth
    const tradePosts = await ctx.db.query("tradePosts").order("desc").take(100);
    
    if (tradePosts.length === 0) return [];
    
    // Chỉ load traders liên quan
    const traderIds = [...new Set(tradePosts.map(p => p.traderId))];
    const tradersRaw = await Promise.all(traderIds.map(id => ctx.db.get(id)));
    const traderMap = new Map(tradersRaw.filter(Boolean).map(t => [t!._id, t!]));
    
    // Chỉ load tradePostCards cho posts này
    const postIds = tradePosts.map(p => p._id);
    const postCardsArrays = await Promise.all(
      postIds.map(postId => 
        ctx.db.query("tradePostCards")
          .withIndex("by_trade_post", q => q.eq("tradePostId", postId))
          .collect()
      )
    );
    const postCardsMap = new Map(postIds.map((id, i) => [id, postCardsArrays[i]]));
    
    // Chỉ load cards liên quan
    const allCardIds = new Set<Id<"cards">>();
    postCardsArrays.flat().forEach(pc => allCardIds.add(pc.cardId));
    const cardsRaw = await Promise.all([...allCardIds].map(id => ctx.db.get(id)));
    const cardMap = new Map(cardsRaw.filter(Boolean).map(c => [c!._id, c!]));
    
    // Count requests per post (dùng index)
    const requestCountsArrays = await Promise.all(
      postIds.map(postId => 
        ctx.db.query("tradeRequests")
          .withIndex("by_trade_post", q => q.eq("tradePostId", postId))
          .collect()
      )
    );
    const requestCountMap = new Map(postIds.map((id, i) => [id, requestCountsArrays[i].length]));
    
    return tradePosts.map(post => {
      const trader = traderMap.get(post.traderId);
      const postCards = postCardsMap.get(post._id) || [];
      
      const haveCardIds = postCards.filter(c => c.type === "have").map(c => c.cardId);
      const wantCardIds = postCards.filter(c => c.type === "want").map(c => c.cardId);
      
      const haveCardsData = haveCardIds
        .map(id => cardMap.get(id))
        .filter(Boolean)
        .map(c => ({ _id: c!._id, name: c!.name, imageUrl: c!.imageUrl }));
      
      const wantCardsData = wantCardIds
        .map(id => cardMap.get(id))
        .filter(Boolean)
        .map(c => ({ _id: c!._id, name: c!.name, imageUrl: c!.imageUrl }));
      
      return {
        ...post,
        traderName: trader?.name || "",
        traderAvatar: trader?.avatarUrl || "",
        traderIsOnline: trader?.isOnline || false,
        haveCardsCount: haveCardIds.length,
        wantCardsCount: wantCardIds.length,
        haveCards: haveCardsData,
        wantCards: wantCardsData,
        requestsCount: requestCountMap.get(post._id) || 0,
      };
    });
  },
});

// ============ OPTIMIZED: Dùng index, chỉ load data cần thiết ============
export const listPaginated = query({
  args: {
    limit: v.number(),
    page: v.optional(v.number()),
    status: v.optional(v.string()),
    traderId: v.optional(v.id("traders")),
    onlineOnly: v.optional(v.boolean()),
    rarity: v.optional(v.string()),
    setName: v.optional(v.string()),
    cardName: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    sortDir: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ============ Step 1: Query tradePosts với index + limit ============
    const MAX_POSTS = 500; // Giới hạn để tránh quá tải bandwidth
    
    const tradePosts = args.status
      ? await ctx.db.query("tradePosts").withIndex("by_status", q => q.eq("status", args.status!)).take(MAX_POSTS)
      : args.traderId
        ? await ctx.db.query("tradePosts").withIndex("by_trader", q => q.eq("traderId", args.traderId!)).take(MAX_POSTS)
        : await ctx.db.query("tradePosts").order("desc").take(MAX_POSTS);
    
    // Early filter by simple conditions
    let filteredPosts = tradePosts.filter(post => {
      if (args.status && post.status !== args.status) return false;
      if (args.status === 'active' && post.isHidden) return false;
      if (args.traderId && post.traderId !== args.traderId) return false;
      // Filter by rarity stored on post (if available)
      if (args.rarity && post.rarity && post.rarity !== args.rarity) return false;
      return true;
    });
    
    // ============ Step 2: Load chỉ traders liên quan ============
    const traderIds = [...new Set(filteredPosts.map(p => p.traderId))];
    const traders = await Promise.all(traderIds.map(id => ctx.db.get(id)));
    const traderMap = new Map(traders.filter(Boolean).map(t => [t!._id, t!]));
    
    // Filter by online if needed
    if (args.onlineOnly) {
      filteredPosts = filteredPosts.filter(post => {
        const trader = traderMap.get(post.traderId);
        return trader?.isOnline;
      });
    }
    
    // ============ Step 3: Load tradePostCards chỉ cho filtered posts ============
    const postIds = filteredPosts.map(p => p._id);
    const allPostCards = await Promise.all(
      postIds.map(postId => 
        ctx.db.query("tradePostCards")
          .withIndex("by_trade_post", q => q.eq("tradePostId", postId))
          .collect()
      )
    );
    const postCardsMap = new Map(postIds.map((id, i) => [id, allPostCards[i]]));
    
    // ============ Step 4: Load chỉ cards liên quan ============
    const allCardIds = new Set<Id<"cards">>();
    allPostCards.flat().forEach(pc => allCardIds.add(pc.cardId));
    
    const cardsArray = await Promise.all([...allCardIds].map(id => ctx.db.get(id)));
    const cardMap = new Map(cardsArray.filter(Boolean).map(c => [c!._id, c!]));
    
    // Load metadata for cards (small tables)
    const [rarities, packs, sets] = await Promise.all([
      ctx.db.query("rarities").collect(),
      ctx.db.query("packs").collect(),
      ctx.db.query("sets").collect(),
    ]);
    const rarityMap = new Map(rarities.map(r => [r._id, r.name]));
    const packMap = new Map(packs.map(p => [p._id, p.setId]));
    const setMap = new Map(sets.map(s => [s._id, s.name]));
    
    // Helper to enrich card
    const enrichCard = (cardId: Id<"cards">) => {
      const card = cardMap.get(cardId);
      if (!card) return null;
      const rarityName = rarityMap.get(card.rarityId) || "";
      const setId = packMap.get(card.packId);
      const setName = setId ? setMap.get(setId) || "" : "";
      return { _id: card._id, name: card.name, imageUrl: card.imageUrl, rarityName, setName };
    };
    
    // ============ Step 5: Build enriched posts ============
    let enrichedPosts = filteredPosts.map(post => {
      const trader = traderMap.get(post.traderId);
      const postCards = postCardsMap.get(post._id) || [];
      
      const haveCards = postCards.filter(c => c.type === "have").map(c => enrichCard(c.cardId)).filter(Boolean);
      const wantCards = postCards.filter(c => c.type === "want").map(c => enrichCard(c.cardId)).filter(Boolean);
      
      return {
        ...post,
        traderName: trader?.name || "",
        traderAvatar: trader?.avatarUrl || "",
        traderIsOnline: trader?.isOnline || false,
        traderTradePoint: trader?.tradePoint ?? 0,
        requestsCount: 0, // Will be loaded separately if needed
        haveCardsCount: haveCards.length,
        wantCardsCount: wantCards.length,
        haveCards: haveCards as { _id: Id<"cards">; name: string; imageUrl: string; rarityName: string; setName: string }[],
        wantCards: wantCards as { _id: Id<"cards">; name: string; imageUrl: string; rarityName: string; setName: string }[],
      };
    });
    
    // ============ Step 6: Apply remaining filters ============
    if (args.setName) {
      enrichedPosts = enrichedPosts.filter(post => 
        [...post.haveCards, ...post.wantCards].some(c => c.setName === args.setName)
      );
    }
    
    if (args.cardName) {
      const searchTerm = args.cardName.toLowerCase();
      enrichedPosts = enrichedPosts.filter(post =>
        [...post.haveCards, ...post.wantCards].some(c => c.name.toLowerCase().includes(searchTerm))
      );
    }
    
    // ============ Step 7: Sort ============
    const sortBy = args.sortBy || "EXPIRES";
    const sortDir = args.sortDir || "ASC";
    enrichedPosts.sort((a, b) => {
      const cmp = sortBy === "CREATED" 
        ? a._creationTime - b._creationTime 
        : a.expiresAt - b.expiresAt;
      return sortDir === "ASC" ? cmp : -cmp;
    });
    
    // ============ Step 8: Paginate ============
    const currentPage = args.page || 1;
    const startIndex = (currentPage - 1) * args.limit;
    const items = enrichedPosts.slice(startIndex, startIndex + args.limit);
    const totalPages = Math.ceil(enrichedPosts.length / args.limit);
    
    // Get filter options from metadata (already loaded)
    const allRarities = rarities.map(r => r.name).sort();
    const allSets = sets.map(s => s.name).sort();

    return { 
      items, 
      total: enrichedPosts.length, 
      totalPages, 
      currentPage,
      rarities: allRarities,
      sets: allSets,
    };
  },
});

// ============ OPTIMIZED: Chỉ load cards liên quan, không fetch ALL ============
export const getById = query({
  args: { id: v.id("tradePosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) return null;
    
    // Load trader và tradePostCards (dùng index)
    const [trader, tradePostCards, tradeRequests] = await Promise.all([
      ctx.db.get(post.traderId),
      ctx.db.query("tradePostCards")
        .withIndex("by_trade_post", q => q.eq("tradePostId", args.id))
        .collect(),
      ctx.db.query("tradeRequests")
        .withIndex("by_trade_post", q => q.eq("tradePostId", args.id))
        .collect(),
    ]);
    
    // Chỉ load cards liên quan (thay vì ALL cards!)
    const haveCardIds = tradePostCards.filter(c => c.type === "have").map(c => c.cardId);
    const wantCardIds = tradePostCards.filter(c => c.type === "want").map(c => c.cardId);
    const allCardIds = [...haveCardIds, ...wantCardIds];
    
    const cardsRaw = await Promise.all(allCardIds.map(id => ctx.db.get(id)));
    const cardMap = new Map(cardsRaw.filter(Boolean).map(c => [c!._id, c!]));
    
    // Type assertion để loại bỏ undefined
    const haveCards = haveCardIds
      .map(id => cardMap.get(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
    const wantCards = wantCardIds
      .map(id => cardMap.get(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
    
    return {
      ...post,
      trader,
      haveCards,
      wantCards,
      requestsCount: tradeRequests.length,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tradePosts"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const toggleHidden = mutation({
  args: { id: v.id("tradePosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (post) {
      await ctx.db.patch(args.id, { isHidden: !post.isHidden });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("tradePosts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const bulkRemove = mutation({
  args: { ids: v.array(v.id("tradePosts")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
    return { deleted: args.ids.length };
  },
});

export const create = mutation({
  args: {
    traderId: v.id("traders"),
    haveCardIds: v.array(v.id("cards")),
    wantCardIds: v.array(v.id("cards")),
    durationHours: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get settings for default duration
    const settings = await ctx.db.query("settings").first();
    const durationHours = args.durationHours ?? settings?.tradePostDurationHours ?? 48;
    
    // Get all cards to validate rarity
    const allCardIds = [...args.haveCardIds, ...args.wantCardIds];
    const cards = await Promise.all(allCardIds.map(id => ctx.db.get(id)));
    const rarities = await ctx.db.query("rarities").collect();
    
    // Get rarity names for all cards
    const cardRarities = cards.map(card => {
      if (!card) return null;
      const rarity = rarities.find(r => r._id === card.rarityId);
      return rarity?.name;
    });
    
    // Check for Crown rarity - not allowed to trade
    const hasCrown = cardRarities.some(r => r?.toLowerCase().includes("crown"));
    if (hasCrown) {
      throw new Error("Không thể giao dịch thẻ có độ hiếm Crown");
    }
    
    // Check all cards have the same rarity
    const uniqueRarities = [...new Set(cardRarities.filter(Boolean))];
    if (uniqueRarities.length > 1) {
      throw new Error("Tất cả thẻ trong giao dịch phải cùng độ hiếm");
    }
    
    const tradeRarity = uniqueRarities[0] || "";
    
    // Check daily limit - OPTIMIZED: take thay collect
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0).getTime();
    
    const recentPosts = await ctx.db
      .query("tradePosts")
      .withIndex("by_trader", q => q.eq("traderId", args.traderId))
      .order("desc")
      .take(50);
    
    const todayCount = recentPosts.filter(p => p._creationTime >= startOfDay).length;
    const maxPosts = settings?.limitTradePostPerTrader ?? 5;
    
    if (todayCount >= maxPosts) {
      throw new Error(`Bạn đã đạt giới hạn ${maxPosts} bài đăng/ngày`);
    }
    
    // Validate note length
    const note = args.note?.slice(0, 50);
    
    // Create trade post
    const expiresAt = Date.now() + durationHours * 60 * 60 * 1000;
    const postId = await ctx.db.insert("tradePosts", {
      traderId: args.traderId,
      status: "active",
      expiresAt,
      isHidden: false,
      note,
      rarity: tradeRarity,
    });
    
    // Create tradePostCards for have cards
    for (const cardId of args.haveCardIds) {
      await ctx.db.insert("tradePostCards", {
        tradePostId: postId,
        cardId,
        type: "have",
      });
    }
    
    // Create tradePostCards for want cards
    for (const cardId of args.wantCardIds) {
      await ctx.db.insert("tradePostCards", {
        tradePostId: postId,
        cardId,
        type: "want",
      });
    }
    
    return postId;
  },
});

// ============ OPTIMIZED: Chỉ load data liên quan, không fetch ALL ============
export const listByCard = query({
  args: { 
    cardId: v.id("cards"),
    type: v.union(v.literal("want"), v.literal("have")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    // Dùng compound index by_card_type
    const filteredPostCards = await ctx.db
      .query("tradePostCards")
      .withIndex("by_card_type", q => q.eq("cardId", args.cardId).eq("type", args.type))
      .collect();
    const postIds = [...new Set(filteredPostCards.map(tpc => tpc.tradePostId))];
    
    // Get trade posts (chỉ load cần thiết)
    const postsRaw = await Promise.all(postIds.map(id => ctx.db.get(id)));
    const activePosts = postsRaw
      .filter(p => p && p.status === "active" && !p.isHidden && p.expiresAt > Date.now())
      .slice(0, limit);
    
    if (activePosts.length === 0) return [];
    
    // Chỉ load traders liên quan
    const traderIds = [...new Set(activePosts.map(p => p!.traderId))];
    const tradersRaw = await Promise.all(traderIds.map(id => ctx.db.get(id)));
    const traderMap = new Map(tradersRaw.filter(Boolean).map(t => [t!._id, t!]));
    
    // Chỉ load tradePostCards cho active posts
    const activePostIds = activePosts.map(p => p!._id);
    const postCardsArrays = await Promise.all(
      activePostIds.map(postId => 
        ctx.db.query("tradePostCards")
          .withIndex("by_trade_post", q => q.eq("tradePostId", postId))
          .collect()
      )
    );
    const postCardsMap = new Map(activePostIds.map((id, i) => [id, postCardsArrays[i]]));
    
    // Chỉ load cards liên quan
    const allCardIds = new Set<Id<"cards">>();
    postCardsArrays.flat().forEach(pc => allCardIds.add(pc.cardId));
    const cardsRaw = await Promise.all([...allCardIds].map(id => ctx.db.get(id)));
    const cardMap = new Map(cardsRaw.filter(Boolean).map(c => [c!._id, c!]));
    
    // Load rarities (small table, OK)
    const rarities = await ctx.db.query("rarities").collect();
    const rarityMap = new Map(rarities.map(r => [r._id, r.name]));
    
    return activePosts.map(post => {
      if (!post) return null;
      const trader = traderMap.get(post.traderId);
      const postCards = postCardsMap.get(post._id) || [];
      
      const haveCardIds = postCards.filter(c => c.type === "have").map(c => c.cardId);
      const wantCardIds = postCards.filter(c => c.type === "want").map(c => c.cardId);
      
      const enrichCard = (cardId: Id<"cards">) => {
        const card = cardMap.get(cardId);
        if (!card) return null;
        const rarityName = rarityMap.get(card.rarityId) || "";
        return { _id: card._id, name: card.name, imageUrl: card.imageUrl, rarityName };
      };
      
      return {
        _id: post._id,
        status: post.status,
        expiresAt: post.expiresAt,
        note: post.note,
        _creationTime: post._creationTime,
        traderName: trader?.name || "",
        traderAvatar: trader?.avatarUrl || "",
        traderIsOnline: trader?.isOnline || false,
        traderTradePoint: trader?.tradePoint ?? 0,
        haveCards: haveCardIds.map(enrichCard).filter(Boolean),
        wantCards: wantCardIds.map(enrichCard).filter(Boolean),
      };
    }).filter(Boolean);
  },
});
