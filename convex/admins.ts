import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SUPER_ADMIN_EMAIL = "trquocviet.web@gmail.com";

// Simple hash function (for demo - production should use proper hashing)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export const list = query({
  args: {
    paginationOpts: v.optional(v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    })),
  },
  handler: async (ctx, args) => {
    const limit = args.paginationOpts?.numItems || 50;
    return await ctx.db
      .query("admins")
      .order("desc")
      .paginate(args.paginationOpts || { numItems: limit, cursor: null });
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("admins") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const login = query({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!admin) return null;
    
    const hashedPassword = simpleHash(args.password);
    if (admin.password !== hashedPassword) return null;
    
    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  },
});

export const create = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
    currentAdminId: v.optional(v.id("admins")),
  },
  handler: async (ctx, args) => {
    // Check if current admin is super admin
    if (args.currentAdminId) {
      const currentAdmin = await ctx.db.get(args.currentAdminId);
      if (!currentAdmin?.isSuperAdmin) {
        throw new Error("Chỉ Super Admin mới có thể tạo admin mới");
      }
    }

    // Check if email already exists
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("Email đã tồn tại");
    }

    const hashedPassword = simpleHash(args.password);
    
    return await ctx.db.insert("admins", {
      username: args.username,
      email: args.email,
      password: hashedPassword,
      isSuperAdmin: false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("admins"),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
    currentAdminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const targetAdmin = await ctx.db.get(args.id);
    if (!targetAdmin) throw new Error("Admin không tồn tại");

    const currentAdmin = await ctx.db.get(args.currentAdminId);
    if (!currentAdmin) throw new Error("Không có quyền");

    // Only super admin can edit
    if (!currentAdmin.isSuperAdmin) {
      throw new Error("Chỉ Super Admin mới có thể chỉnh sửa");
    }

    // Cannot change super admin's email
    if (targetAdmin.isSuperAdmin && args.email && args.email !== targetAdmin.email) {
      throw new Error("Không thể thay đổi email của Super Admin");
    }

    const updates: Partial<{
      username: string;
      email: string;
      password: string;
    }> = {};

    if (args.username) updates.username = args.username;
    if (args.email) updates.email = args.email;
    if (args.password) updates.password = simpleHash(args.password);

    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("admins"),
    currentAdminId: v.id("admins"),
  },
  handler: async (ctx, args) => {
    const targetAdmin = await ctx.db.get(args.id);
    if (!targetAdmin) throw new Error("Admin không tồn tại");

    // Cannot delete super admin
    if (targetAdmin.isSuperAdmin) {
      throw new Error("Không thể xóa Super Admin");
    }

    const currentAdmin = await ctx.db.get(args.currentAdminId);
    if (!currentAdmin) throw new Error("Không có quyền");

    // Only super admin can delete
    if (!currentAdmin.isSuperAdmin) {
      throw new Error("Chỉ Super Admin mới có thể xóa admin");
    }

    await ctx.db.delete(args.id);
  },
});

// Seed super admin
export const seedSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", SUPER_ADMIN_EMAIL))
      .first();

    if (existing) {
      return { success: false, message: "Super Admin đã tồn tại" };
    }

    const hashedPassword = simpleHash("Viet123abc'");
    
    await ctx.db.insert("admins", {
      username: "Super Admin",
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      isSuperAdmin: true,
      createdAt: Date.now(),
    });

    return { success: true, message: "Đã tạo Super Admin" };
  },
});
