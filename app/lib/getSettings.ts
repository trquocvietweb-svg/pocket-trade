type Settings = {
  siteName: string;
  logo?: string;
  favicon?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  contactEmail?: string;
  contactPhone?: string;
  limitTradePostPerTrader: number;
  limitCardPerPost: number;
  tradePostDurationHours: number;
  limitRequestPerTraderPerDay?: number;
} | null;

export async function getSettings(): Promise<Settings> {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return null;

    const httpUrl = convexUrl.replace(".cloud", ".site");
    const res = await fetch(`${httpUrl}/settings`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
