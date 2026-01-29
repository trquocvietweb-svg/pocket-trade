'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function useAdminLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Load theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(shouldBeDark);
  }, []);

  const handleThemeToggle = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    localStorage.setItem('admin-theme', newValue ? 'dark' : 'light');
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleChangeView = (view: string) => {
    const map: Record<string, string> = {
      dashboard: '/admin',
      posts: '/admin/posts',
      users: '/admin/users',
      settings: '/admin/settings',
    };
    const target = map[view];
    if (target) router.push(target);
  };

  const getCurrentView = () => {
    if (pathname?.includes('/posts')) return 'posts';
    if (pathname?.includes('/users')) return 'users';
    if (pathname?.includes('/settings')) return 'settings';
    return 'dashboard';
  };

  const getBreadcrumbs = () => {
    const view = getCurrentView();

    if (view === 'posts') {
      if (pathname?.endsWith('/new')) return ['Bài viết', 'Tạo mới'];
      if (pathname?.match(/\/posts\/\d+\/edit$/)) return ['Bài viết', 'Chỉnh sửa'];
      return ['Bài viết', 'Danh sách'];
    }

    if (view === 'users') {
      if (pathname?.endsWith('/new')) return ['Người dùng', 'Tạo mới'];
      if (pathname?.match(/\/users\/\d+\/edit$/)) return ['Người dùng', 'Chỉnh sửa'];
      return ['Người dùng', 'Danh sách'];
    }

    if (view === 'settings') {
      return ['Cài đặt'];
    }

    return ['Dashboard'];
  };

  return {
    isDarkMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    pathname,
    handleThemeToggle,
    handleChangeView,
    getCurrentView,
    getBreadcrumbs,
  };
}
