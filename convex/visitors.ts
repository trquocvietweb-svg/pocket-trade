import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Parse device from userAgent
const parseDevice = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(ua)) return "mobile";
  return "desktop";
};

// Parse OS from userAgent
const parseOS = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "iOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macos")) return "macOS";
  if (ua.includes("linux")) return "Linux";
  return "Khác";
};

const getTimeRanges = (range: string) => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  let duration: number;
  
  switch (range) {
    case "today": duration = day; break;
    case "week": duration = 7 * day; break;
    case "month": duration = 30 * day; break;
    case "3months": duration = 90 * day; break;
    case "year": duration = 365 * day; break;
    default: duration = 0;
  }
  
  return {
    currentStart: duration ? now - duration : 0,
    previousStart: duration ? now - duration * 2 : 0,
    previousEnd: duration ? now - duration : 0,
  };
};

export const trackVisitor = mutation({
  args: {
    ipAddress: v.string(),
    userAgent: v.string(),
    pageUrl: v.string(),
    referrer: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const device = parseDevice(args.userAgent);
    const os = parseOS(args.userAgent);

    await ctx.db.insert("visitors", {
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      pageUrl: args.pageUrl,
      referrer: args.referrer,
      country: args.country,
      device,
      os,
      visitedAt: Date.now(),
    });
  },
});

// ============ OPTIMIZED: Dùng index range query thay vì collect all ============
export const getStats = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    const { currentStart, previousStart, previousEnd } = getTimeRanges(args.timeRange);
    
    // Dùng index để chỉ lấy visitors trong khoảng thời gian cần thiết (với limit reasonable)
    const [currentVisitors, previousVisitors] = await Promise.all([
      ctx.db.query("visitors")
        .withIndex("by_visited_at", q => q.gte("visitedAt", currentStart))
        .take(10000), // Reasonable limit
      currentStart > 0 
        ? ctx.db.query("visitors")
            .withIndex("by_visited_at", q => q.gte("visitedAt", previousStart).lt("visitedAt", previousEnd))
            .take(10000) // Reasonable limit
        : [],
    ]);
    
    const uniqueCurrentIPs = new Set(currentVisitors.map(v => v.ipAddress)).size;
    const uniquePreviousIPs = new Set(previousVisitors.map(v => v.ipAddress)).size;
    
    const visitorsChange = uniquePreviousIPs > 0 
      ? Math.round(((uniqueCurrentIPs - uniquePreviousIPs) / uniquePreviousIPs) * 100) 
      : 0;
    const pageViewsChange = previousVisitors.length > 0 
      ? Math.round(((currentVisitors.length - previousVisitors.length) / previousVisitors.length) * 100) 
      : 0;

    return {
      visitors: uniqueCurrentIPs,
      pageViews: currentVisitors.length,
      visitorsChange,
      pageViewsChange,
    };
  },
});

export const getChartData = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    const { currentStart } = getTimeRanges(args.timeRange);
    
    // Dùng index range query
    const visitors = await ctx.db.query("visitors")
      .withIndex("by_visited_at", q => q.gte("visitedAt", currentStart))
      .take(10000); // Reasonable limit
    
    const grouped: Record<string, number> = {};
    
    visitors.forEach(visitor => {
      const date = new Date(visitor.visitedAt);
      let key: string;
      
      switch (args.timeRange) {
        case "today":
          key = `${date.getHours().toString().padStart(2, "0")}:00`;
          break;
        case "week":
          const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
          key = days[date.getDay()];
          break;
        case "month":
          key = date.getDate().toString().padStart(2, "0");
          break;
        case "3months":
        case "year":
          key = `T${date.getMonth() + 1}`;
          break;
        default:
          key = date.getFullYear().toString();
      }
      
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([name, visitors]) => ({ name, visitors }));
  },
});

export const getTopPages = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    const { currentStart } = getTimeRanges(args.timeRange);
    
    const visitors = await ctx.db.query("visitors")
      .withIndex("by_visited_at", q => q.gte("visitedAt", currentStart))
      .take(10000); // Reasonable limit
    
    const grouped: Record<string, number> = {};
    visitors.forEach(v => {
      const path = new URL(v.pageUrl, "http://localhost").pathname;
      grouped[path] = (grouped[path] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([path, visitors]) => ({ path, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 5);
  },
});

export const getTopReferrers = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    const { currentStart } = getTimeRanges(args.timeRange);
    
    const visitors = await ctx.db.query("visitors")
      .withIndex("by_visited_at", q => q.gte("visitedAt", currentStart))
      .take(10000); // Reasonable limit
    
    const grouped: Record<string, number> = {};
    visitors.forEach(v => {
      const source = v.referrer 
        ? new URL(v.referrer).hostname 
        : "Trực tiếp";
      grouped[source] = (grouped[source] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([source, visitors]) => ({ source, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 5);
  },
});

export const getCountryStats = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    const { currentStart } = getTimeRanges(args.timeRange);
    
    const visitors = await ctx.db.query("visitors")
      .withIndex("by_visited_at", q => q.gte("visitedAt", currentStart))
      .take(10000); // Reasonable limit
    
    const grouped: Record<string, number> = {};
    visitors.forEach(v => {
      const country = v.country || "Không xác định";
      grouped[country] = (grouped[country] || 0) + 1;
    });

    const total = visitors.length;
    const countryFlags: Record<string, string> = {
      "Việt Nam": "🇻🇳",
      "Indonesia": "🇮🇩",
      "Nhật Bản": "🇯🇵",
      "Hồng Kông": "🇭🇰",
      "Mỹ": "🇺🇸",
      "Không xác định": "🌐",
    };

    return Object.entries(grouped)
      .map(([country, count]) => ({
        country,
        flag: countryFlags[country] || "🌐",
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);
  },
});

export const getDeviceStats = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    const { currentStart } = getTimeRanges(args.timeRange);
    
    const visitors = await ctx.db.query("visitors")
      .withIndex("by_visited_at", q => q.gte("visitedAt", currentStart))
      .take(10000); // Reasonable limit
    
    const grouped: Record<string, number> = {};
    visitors.forEach(v => {
      const device = v.device || "Không xác định";
      grouped[device] = (grouped[device] || 0) + 1;
    });

    const total = visitors.length;
    const deviceLabels: Record<string, string> = {
      mobile: "Di động",
      desktop: "Máy tính",
      tablet: "Máy tính bảng",
    };

    return Object.entries(grouped)
      .map(([device, count]) => ({
        name: deviceLabels[device] || device,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.percent - a.percent);
  },
});

export const getOsStats = query({
  args: { timeRange: v.string() },
  handler: async (ctx, args) => {
    const { currentStart } = getTimeRanges(args.timeRange);
    
    const visitors = await ctx.db.query("visitors")
      .withIndex("by_visited_at", q => q.gte("visitedAt", currentStart))
      .take(10000); // Reasonable limit
    
    const grouped: Record<string, number> = {};
    visitors.forEach(v => {
      const os = v.os || "Không xác định";
      grouped[os] = (grouped[os] || 0) + 1;
    });

    const total = visitors.length;

    return Object.entries(grouped)
      .map(([name, count]) => ({
        name,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);
  },
});
