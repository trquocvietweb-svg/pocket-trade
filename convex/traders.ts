import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// ============ ADMIN: Giới hạn 200 traders ============
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("traders").take(200);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("traders")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const checkNameExists = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const trader = await ctx.db
      .query("traders")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    return !!trader;
  },
});

export const checkFriendCodeExists = query({
  args: { friendCode: v.string() },
  handler: async (ctx, args) => {
    const trader = await ctx.db
      .query("traders")
      .withIndex("by_friend_code", (q) => q.eq("friendCode", args.friendCode))
      .first();
    return !!trader;
  },
});

export const getById = query({
  args: { id: v.id("traders") },
  handler: async (ctx, args) => {
    const trader = await ctx.db.get(args.id);
    if (!trader) return null;
    const { password, ...traderWithoutPassword } = trader;
    void password;
    return traderWithoutPassword;
  },
});

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    avatarUrl: v.optional(v.string()),
    friendCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check unique email
    const existingEmail = await ctx.db
      .query("traders")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existingEmail) {
      throw new Error("Email đã tồn tại");
    }

    // Check unique name
    const existingName = await ctx.db
      .query("traders")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existingName) {
      throw new Error("Tên hiển thị đã tồn tại");
    }

    // Check unique friend code
    if (args.friendCode) {
      const existingFriendCode = await ctx.db
        .query("traders")
        .withIndex("by_friend_code", (q) => q.eq("friendCode", args.friendCode))
        .first();
      if (existingFriendCode) {
        throw new Error("Friend Code đã tồn tại");
      }
    }

    const hashedPassword = simpleHash(args.password);
    
    const traderId = await ctx.db.insert("traders", {
      name: args.name,
      email: args.email,
      password: hashedPassword,
      legitPoint: 0,
      status: "active",
      avatarUrl: args.avatarUrl,
      friendCode: args.friendCode,
    });

    const trader = await ctx.db.get(traderId);
    if (!trader) throw new Error("Lỗi tạo tài khoản");
    
    const { password, ...traderWithoutPassword } = trader;
    void password;
    return traderWithoutPassword;
  },
});

export const login = query({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const trader = await ctx.db
      .query("traders")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!trader) return null;
    if (trader.status === "banned") {
      throw new Error("Tài khoản đã bị khóa");
    }
    
    const hashedPassword = simpleHash(args.password);
    if (trader.password !== hashedPassword) return null;
    
    const { password, ...traderWithoutPassword } = trader;
    void password;
    return traderWithoutPassword;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("traders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateLastSeen = mutation({
  args: { id: v.id("traders") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastSeenAt: Date.now(), isOnline: true });
  },
});

export const setOffline = mutation({
  args: { id: v.id("traders") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isOnline: false });
  },
});

export const updateProfile = mutation({
  args: {
    id: v.id("traders"),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    friendCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trader = await ctx.db.get(args.id);
    if (!trader) throw new Error("Trader không tồn tại");

    // Check unique name if changed
    if (args.name && args.name !== trader.name) {
      const existingName = await ctx.db
        .query("traders")
        .withIndex("by_name", (q) => q.eq("name", args.name!))
        .first();
      if (existingName) throw new Error("Tên hiển thị đã tồn tại");
    }

    // Check unique friend code if changed
    if (args.friendCode && args.friendCode !== trader.friendCode) {
      const existingFriendCode = await ctx.db
        .query("traders")
        .withIndex("by_friend_code", (q) => q.eq("friendCode", args.friendCode!))
        .first();
      if (existingFriendCode) throw new Error("Friend Code đã tồn tại");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
    
    const updated = await ctx.db.get(id);
    if (!updated) throw new Error("Lỗi cập nhật");
    const { password, ...traderWithoutPassword } = updated;
    void password;
    return traderWithoutPassword;
  },
});

// Admin functions
export const adminCreate = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    avatarUrl: v.optional(v.string()),
    friendCode: v.optional(v.string()),
    legitPoint: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check unique email
    const existingEmail = await ctx.db
      .query("traders")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existingEmail) throw new Error("Email đã tồn tại");

    // Check unique name
    const existingName = await ctx.db
      .query("traders")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existingName) throw new Error("Tên hiển thị đã tồn tại");

    // Check unique friend code
    if (args.friendCode) {
      const existingFriendCode = await ctx.db
        .query("traders")
        .withIndex("by_friend_code", (q) => q.eq("friendCode", args.friendCode))
        .first();
      if (existingFriendCode) throw new Error("Friend Code đã tồn tại");
    }

    const hashedPassword = simpleHash(args.password);
    
    const traderId = await ctx.db.insert("traders", {
      name: args.name,
      email: args.email,
      password: hashedPassword,
      legitPoint: args.legitPoint ?? 0,
      status: "active",
      avatarUrl: args.avatarUrl,
      friendCode: args.friendCode,
    });

    return traderId;
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("traders"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    friendCode: v.optional(v.string()),
    legitPoint: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trader = await ctx.db.get(args.id);
    if (!trader) throw new Error("Trader không tồn tại");

    // Check unique name if changed
    if (args.name && args.name !== trader.name) {
      const nameToCheck = args.name;
      const existingName = await ctx.db
        .query("traders")
        .withIndex("by_name", (q) => q.eq("name", nameToCheck))
        .first();
      if (existingName) throw new Error("Tên hiển thị đã tồn tại");
    }

    // Check unique email if changed
    if (args.email && args.email !== trader.email) {
      const emailToCheck = args.email;
      const existingEmail = await ctx.db
        .query("traders")
        .withIndex("by_email", (q) => q.eq("email", emailToCheck))
        .first();
      if (existingEmail) throw new Error("Email đã tồn tại");
    }

    // Check unique friend code if changed
    if (args.friendCode && args.friendCode !== trader.friendCode) {
      const friendCodeToCheck = args.friendCode;
      const existingFriendCode = await ctx.db
        .query("traders")
        .withIndex("by_friend_code", (q) => q.eq("friendCode", friendCodeToCheck))
        .first();
      if (existingFriendCode) throw new Error("Friend Code đã tồn tại");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.friendCode !== undefined) updates.friendCode = args.friendCode;
    if (args.legitPoint !== undefined) updates.legitPoint = args.legitPoint;
    if (args.status !== undefined) updates.status = args.status;
    if (args.password) updates.password = simpleHash(args.password);

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const adminDelete = mutation({
  args: { id: v.id("traders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// OTP Functions
export const createOtp = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const trader = await ctx.db
      .query("traders")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!trader) {
      throw new Error("Email không tồn tại trong hệ thống");
    }

    // Delete old OTPs for this email
    const oldOtps = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    
    for (const otp of oldOtps) {
      await ctx.db.delete(otp._id);
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await ctx.db.insert("otpCodes", {
      email: args.email,
      code,
      expiresAt,
      used: false,
    });

    return { code, email: args.email };
  },
});

export const verifyOtp = query({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const otp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!otp) return { valid: false, message: "OTP không tồn tại" };
    if (otp.used) return { valid: false, message: "OTP đã được sử dụng" };
    if (otp.expiresAt < Date.now()) return { valid: false, message: "OTP đã hết hạn" };
    if (otp.code !== args.code) return { valid: false, message: "OTP không đúng" };
    
    return { valid: true };
  },
});

export const resetPassword = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const otp = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!otp || otp.used || otp.expiresAt < Date.now() || otp.code !== args.code) {
      throw new Error("OTP không hợp lệ");
    }

    const trader = await ctx.db
      .query("traders")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!trader) throw new Error("Trader không tồn tại");

    // Update password
    const hashedPassword = simpleHash(args.newPassword);
    await ctx.db.patch(trader._id, { password: hashedPassword });

    // Mark OTP as used
    await ctx.db.patch(otp._id, { used: true });

    return { success: true };
  },
});
