'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useAdminLayout } from './hooks/useAdminLayout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentPathname = usePathname();
  const isLoginPage = currentPathname === '/admin/login';

  const {
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
  } = useAdminLayout();

  // Login page - no sidebar/header
  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900">{children}</div>;
  }

  return (
    <div
      className={`min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans`}
    >
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 transform ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          currentView={getCurrentView()}
          currentPath={pathname}
          onChangeView={handleChangeView}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isDarkMode={isDarkMode}
          toggleTheme={handleThemeToggle}
          breadcrumbs={getBreadcrumbs()}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-scroll scroll-smooth">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
