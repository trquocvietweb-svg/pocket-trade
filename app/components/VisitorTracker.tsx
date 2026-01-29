'use client';

import { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();
  const trackVisitor = useMutation(api.visitors.trackVisitor);
  const trackedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Skip admin routes
    if (pathname.startsWith('/admin')) return;
    
    // Skip if already tracked this path in this session
    if (trackedPaths.current.has(pathname)) return;
    trackedPaths.current.add(pathname);

    const track = async () => {
      try {
        const res = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const { ipAddress, country } = await res.json();

        await trackVisitor({
          ipAddress,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href,
          referrer: document.referrer || undefined,
          country,
        });
      } catch {
        // Silent fail - don't break the app for tracking
      }
    };

    track();
  }, [pathname, trackVisitor]);

  return null;
}
