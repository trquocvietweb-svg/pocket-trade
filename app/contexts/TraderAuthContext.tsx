'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface Trader {
  _id: Id<"traders">;
  name: string;
  email: string;
  avatarUrl?: string;
  legitPoint: number;
  tradePoint?: number;
  friendCode?: string;
  status?: string;
}

interface TraderAuthContextType {
  trader: Trader | null;
  setTrader: (trader: Trader | null) => void;
  logout: () => void;
  isLoading: boolean;
  refreshTrader: () => Promise<void>;
}

const TraderAuthContext = createContext<TraderAuthContextType | undefined>(undefined);

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const ONLINE_TIMEOUT = 60000; // 1 minute - fallback for crash/network loss

export function TraderAuthProvider({ children }: { children: ReactNode }) {
  const [trader, setTraderState] = useState<Trader | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const convex = useConvex();
  const updateLastSeen = useMutation(api.traders.updateLastSeen);
  const setOffline = useMutation(api.traders.setOffline);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const traderIdRef = useRef<Id<"traders"> | null>(null);

  // Keep traderId in ref for beforeunload
  useEffect(() => {
    traderIdRef.current = trader?._id ?? null;
  }, [trader?._id]);

  useEffect(() => {
    const stored = localStorage.getItem('trader');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        Promise.resolve().then(() => setTraderState(parsed));
      } catch {
        localStorage.removeItem('trader');
      }
    }
    Promise.resolve().then(() => setIsLoading(false));
  }, []);

  // Set offline when tab closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (traderIdRef.current) {
        // Use sendBeacon for reliable delivery on tab close
        const url = `${process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site')}/setOffline`;
        navigator.sendBeacon(url, JSON.stringify({ id: traderIdRef.current }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Heartbeat to update online status
  useEffect(() => {
    if (!trader?._id) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    const sendHeartbeat = () => {
      updateLastSeen({ id: trader._id }).catch(() => {});
    };

    // Send immediately when logged in
    sendHeartbeat();

    // Then send every 30 seconds
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Also send on visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trader?._id, updateLastSeen]);

  const setTrader = (newTrader: Trader | null) => {
    setTraderState(newTrader);
    if (newTrader) {
      localStorage.setItem('trader', JSON.stringify(newTrader));
    } else {
      localStorage.removeItem('trader');
    }
  };

  const logout = () => {
    // Set offline before logout
    if (trader?._id) {
      setOffline({ id: trader._id }).catch(() => {});
    }
    setTrader(null);
  };

  const refreshTrader = async () => {
    if (!trader?._id) return;
    try {
      const updated = await convex.query(api.traders.getById, { id: trader._id });
      if (updated) {
        setTrader(updated as Trader);
      }
    } catch {
      // Ignore errors
    }
  };

  return (
    <TraderAuthContext.Provider value={{ trader, setTrader, logout, isLoading, refreshTrader }}>
      {children}
    </TraderAuthContext.Provider>
  );
}

export function useTraderAuth() {
  const context = useContext(TraderAuthContext);
  if (!context) {
    throw new Error('useTraderAuth must be used within TraderAuthProvider');
  }
  return context;
}

// Helper function to check if trader is online
// Priority: isOnline field > lastSeenAt fallback
export function isTraderOnline(isOnline: boolean | undefined, lastSeenAt: number | undefined): boolean {
  // If isOnline is explicitly set, use it
  if (isOnline !== undefined) return isOnline;
  // Fallback to lastSeenAt for crash/network loss cases
  if (!lastSeenAt) return false;
  return lastSeenAt > Date.now() - ONLINE_TIMEOUT;
}
