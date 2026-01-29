import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip login page
  if (pathname === "/admin/login") {
    const session = request.cookies.get("admin_session");
    if (session?.value) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("admin_session");
    
    if (!session?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // i18n: Detect country và set locale cookie cho (site) routes
  const response = NextResponse.next();
  const localeCookie = request.cookies.get("locale");
  
  if (!localeCookie) {
    // Vercel/Cloudflare headers
    const country = request.headers.get("x-vercel-ip-country") 
      || request.headers.get("cf-ipcountry");
    
    // VN → tiếng Việt, còn lại → tiếng Anh
    const locale = country === "VN" ? "vi" : "en";
    response.cookies.set("locale", locale, { 
      path: "/",
      maxAge: 31536000 // 1 năm
    });
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
