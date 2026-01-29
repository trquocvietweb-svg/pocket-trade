import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Rarity (Độ hiếm)
  rarities: defineTable({
    name: v.string(), // ◆, ◆◆, ◆◆◆, ◆◆◆◆, ★, ★★, ★★★, ♢, Shiny Rare, Shiny Super Rare
    imageUrl: v.string(),
  }),

  // 2. Series
  series: defineTable({
    name: v.string(), // A Series, B Series...
  }),

  // 3. Card
  cards: defineTable({
    name: v.string(),
    rarityId: v.id("rarities"),
    supertype: v.string(), // pokemon, trainer
    subtype: v.string(), // Basic, Stage 1, Stage 2, ex, Item, Supporter, Tool
    type: v.string(), // Grass, Fire, Water, Lightning, Psychic, Fighting, Darkness, Metal, Dragon, Colorless
    packId: v.id("packs"),
    cardNumber: v.string(), // "001/100"
    imageUrl: v.string(),
  })
    .index("by_pack", ["packId"])
    .index("by_rarity", ["rarityId"])
    .index("by_type", ["type"]),

  // 4. Pack
  packs: defineTable({
    name: v.string(),
    setId: v.id("sets"),
    imageUrl: v.optional(v.string()),
  }).index("by_set", ["setId"]),

  // 5. Set
  sets: defineTable({
    name: v.string(),
    imageUrl: v.string(),
    setCode: v.string(),
    seriesId: v.id("series"),
    order: v.optional(v.number()), // Thứ tự hiển thị
  })
    .index("by_series", ["seriesId"])
    .index("by_order", ["order"]),

  // 6. Admin
  admins: defineTable({
    username: v.string(),
    email: v.string(),
    password: v.string(),
    isSuperAdmin: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  // 7. Trader
  traders: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    avatarUrl: v.optional(v.string()),
    legitPoint: v.number(), // default 0
    tradePoint: v.optional(v.number()), // default 0, +1 khi giao dịch thành công
    friendCode: v.optional(v.string()),
    status: v.optional(v.string()), // "active" | "banned", default "active"
    lastSeenAt: v.optional(v.number()), // timestamp - fallback for crash/network loss
    isOnline: v.optional(v.boolean()), // realtime online status
  })
    .index("by_email", ["email"])
    .index("by_name", ["name"])
    .index("by_friend_code", ["friendCode"])
    .index("by_status", ["status"]),

  // 8. Trade-post
  tradePosts: defineTable({
    traderId: v.id("traders"),
    status: v.string(), // active, expired, cancelled, matched
    expiresAt: v.number(), // timestamp
    isHidden: v.boolean(), // default false
    note: v.optional(v.string()), // Ghi chú giao dịch (max 50 chars)
    rarity: v.optional(v.string()), // Độ hiếm của cards trong giao dịch
  })
    .index("by_trader", ["traderId"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  // 9. Trade-request
  tradeRequests: defineTable({
    tradePostId: v.id("tradePosts"),
    requesterId: v.id("traders"),
    offeredCardId: v.id("cards"), // Lá bài requester đưa (từ wantCards của post)
    requestedCardId: v.id("cards"), // Lá bài requester muốn nhận (từ haveCards của post)
    message: v.optional(v.string()),
    status: v.string(), // pending, accepted, declined
  })
    .index("by_trade_post", ["tradePostId"])
    .index("by_requester", ["requesterId"])
    .index("by_trade_post_status", ["tradePostId", "status"])
    .index("by_requester_status", ["requesterId", "status"]),

  // 10. Trade-post-Card (Pivot)
  tradePostCards: defineTable({
    tradePostId: v.id("tradePosts"),
    cardId: v.id("cards"),
    type: v.string(), // "have" | "want"
  })
    .index("by_trade_post", ["tradePostId"])
    .index("by_card", ["cardId"])
    .index("by_card_type", ["cardId", "type"]),

  // 11. Chat
  chats: defineTable({
    tradePostId: v.id("tradePosts"),
    tradeRequestId: v.id("tradeRequests"),
    traderHostId: v.id("traders"), // Chủ trade post
    traderGuestId: v.id("traders"), // Người gửi request
    status: v.string(), // "active" | "completed" | "cancelled"
    hostConfirmed: v.optional(v.boolean()), // Host đã chốt chưa
    guestConfirmed: v.optional(v.boolean()), // Guest đã chốt chưa
    cancelledBy: v.optional(v.id("traders")), // Ai đã hủy
  })
    .index("by_trade_post", ["tradePostId"])
    .index("by_trade_request", ["tradeRequestId"])
    .index("by_host", ["traderHostId"])
    .index("by_guest", ["traderGuestId"]),

  // 12. Message
  messages: defineTable({
    chatId: v.id("chats"),
    senderId: v.id("traders"),
    content: v.string(),
    contentType: v.string(), // "text" | "image"
    isRead: v.boolean(), // default false
  }).index("by_chat", ["chatId"]),

  // 13. Trader-Card (Lịch sử trade)
  traderCards: defineTable({
    traderId: v.id("traders"),
    cardId: v.id("cards"),
    type: v.string(), // "received" | "given"
    quantity: v.number(),
    tradePostId: v.id("tradePosts"),
  })
    .index("by_trader", ["traderId"])
    .index("by_card", ["cardId"]),

  // 14. Setting (chỉ 1 record)
  settings: defineTable({
    siteName: v.string(),
    logo: v.optional(v.string()),
    favicon: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    seoKeywords: v.optional(v.array(v.string())), // ["Pocket Trade", "Pokemon TCG", ...]
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    limitTradePostPerTrader: v.number(), // default 5
    limitCardPerPost: v.number(), // default 10
    tradePostDurationHours: v.number(), // default 48
    limitRequestPerTraderPerDay: v.optional(v.number()), // default 20
  }),

  // 15. Event
  events: defineTable({
    name: v.string(),
    content: v.string(), // HTML
    imageUrl: v.optional(v.string()),
    startDate: v.number(), // timestamp
    endDate: v.number(), // timestamp
    isActive: v.boolean(), // default false
  }).index("by_active", ["isActive"]),

  // 16. Visitor
  visitors: defineTable({
    ipAddress: v.string(),
    userAgent: v.string(),
    pageUrl: v.string(),
    referrer: v.optional(v.string()),
    country: v.optional(v.string()), // Lookup từ IP khi tạo record
    device: v.optional(v.string()), // mobile, desktop, tablet (parse từ userAgent)
    os: v.optional(v.string()), // iOS, Android, Windows, Mac (parse từ userAgent)
    visitedAt: v.number(), // timestamp
  }).index("by_visited_at", ["visitedAt"]),

  // 17. Post (Bài viết)
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.string(), // HTML from Lexical
    markdownContent: v.optional(v.string()), // Raw markdown text (khi import từ .md)
    imageUrl: v.optional(v.string()),
    isPublished: v.boolean(),
    isMarkdown: v.optional(v.boolean()), // true = render as markdown, false/undefined = render as HTML
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["isPublished"])
    .index("by_published_date", ["isPublished", "createdAt"]),

  // 18. Post Categories (Danh mục bài viết)
  postCategories: defineTable({
    name: v.string(),
    slug: v.string(), // Auto-generated from name
  }).index("by_slug", ["slug"]),

  // 19. Post-Category Pivot (Many-to-many)
  postCategoryPivot: defineTable({
    postId: v.id("posts"),
    categoryId: v.id("postCategories"),
  })
    .index("by_post", ["postId"])
    .index("by_category", ["categoryId"])
    .index("by_post_category", ["postId", "categoryId"]),

  // 20. Files (track uploaded files for cleanup)
  files: defineTable({
    storageId: v.id("_storage"),
    url: v.string(),
    usedBy: v.optional(v.string()), // "rarities:id", "sets:id", etc. null = orphan
    createdAt: v.number(),
  })
    .index("by_storage_id", ["storageId"])
    .index("by_used_by", ["usedBy"])
    .index("by_url", ["url"]),

  // 21. OTP Codes (for password reset)
  otpCodes: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_code", ["code"]),
});
