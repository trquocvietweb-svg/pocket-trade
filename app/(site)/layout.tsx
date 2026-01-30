import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "../globals.css";
import NavigationWrapper from "../components/NavigationWrapper";
import { ConvexClientProvider } from "../ConvexClientProvider";
import { TraderAuthProvider } from "../contexts/TraderAuthContext";
import { LocaleProvider } from "../contexts/LocaleContext";
import VisitorTracker from "../components/VisitorTracker";
import { getSettings } from "../lib/getSettings";
import { Locale } from "../lib/i18n/translations";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    title: settings?.seoTitle || settings?.siteName || "Pocket Trade - Pokemon TCG",
    description: settings?.seoDescription || "Trade Pokemon TCG cards",
    keywords: settings?.seoKeywords?.join(", ") || "Pokemon TCG, Trade, Cards",
    icons: {
      icon: settings?.favicon || "/favicon.ico",
      shortcut: settings?.favicon || "/favicon.ico",
      apple: settings?.favicon || "/favicon.ico",
    },
    openGraph: {
      title: settings?.seoTitle || settings?.siteName || "Pocket Trade - Pokemon TCG",
      description: settings?.seoDescription || "Trade Pokemon TCG cards",
      siteName: settings?.siteName || "Pocket Trade",
      images: settings?.logo ? [{ url: settings.logo }] : [],
    },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "vi") as Locale;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          <LocaleProvider initialLocale={locale}>
            <TraderAuthProvider>
              <VisitorTracker />
              <Toaster richColors position="top-right" />
              <NavigationWrapper>{children}</NavigationWrapper>
            </TraderAuthProvider>
          </LocaleProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
