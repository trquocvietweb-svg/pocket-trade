import { NextRequest, NextResponse } from "next/server";

const countryMap: Record<string, string> = {
  VN: "Việt Nam",
  US: "Mỹ",
  JP: "Nhật Bản",
  KR: "Hàn Quốc",
  TW: "Đài Loan",
  HK: "Hồng Kông",
  SG: "Singapore",
  TH: "Thái Lan",
  ID: "Indonesia",
  MY: "Malaysia",
  PH: "Philippines",
  CN: "Trung Quốc",
  AU: "Úc",
  GB: "Anh",
  DE: "Đức",
  FR: "Pháp",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Get IP from headers (works with most proxies/cloudflare)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  // Lookup country from IP
  let country: string | undefined;
  try {
    if (ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.countryCode) {
          country = countryMap[geo.countryCode] || geo.countryCode;
        }
      }
    }
  } catch {
    // Silent fail
  }

  return NextResponse.json({
    ipAddress: ip,
    country,
    ...body,
  });
}
