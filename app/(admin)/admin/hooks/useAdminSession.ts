'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface AdminSession {
  id: string;
  email: string;
  username: string;
  isSuperAdmin: boolean;
}

export function useAdminSession() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setAdmin(null);
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return { admin, loading, logout, refetch: fetchSession };
}
