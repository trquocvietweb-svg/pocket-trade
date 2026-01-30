'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  currentView?: string;
  currentPath?: string;
  onChangeView?: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  currentView,
  currentPath,
  onChangeView,
}) => {
  const pathname = usePathname();
  const activePath = currentPath || pathname;
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const autoExpandedMenu = useMemo(() => {
    if (activePath.startsWith('/admin/posts') || activePath.startsWith('/admin/categories')) {
      return 'Nội dung';
    }
    if (
      activePath.startsWith('/admin/cards') ||
      activePath.startsWith('/admin/rarities') ||
      activePath.startsWith('/admin/packs') ||
      activePath.startsWith('/admin/sets') ||
      activePath.startsWith('/admin/series')
    ) {
      return 'Quản lý thẻ';
    }
    if (activePath.startsWith('/admin/traders') || activePath.startsWith('/admin/trade-posts')) {
      return 'Giao dịch';
    }
    if (
      activePath.startsWith('/admin/events') ||
      activePath.startsWith('/admin/admins') ||
      activePath.startsWith('/admin/settings')
    ) {
      return 'Hệ thống';
    }
    return null;
  }, [activePath]);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng Quan', href: '/admin' },
  ];

  const contentGroup = [
    { id: 'posts', label: 'Bài Viết', href: '/admin/posts' },
    { id: 'categories', label: 'Danh Mục', href: '/admin/categories' },
  ];

  const cardGroup = [
    { id: 'cards', label: 'Thẻ Bài', href: '/admin/cards' },
    { id: 'rarities', label: 'Độ Hiếm', href: '/admin/rarities' },
    { id: 'packs', label: 'Packs', href: '/admin/packs' },
    { id: 'sets', label: 'Sets', href: '/admin/sets' },
    { id: 'series', label: 'Series', href: '/admin/series' },
  ];

  const tradeGroup = [
    { id: 'traders', label: 'Traders', href: '/admin/traders' },
    { id: 'trade-posts', label: 'Trade Posts', href: '/admin/trade-posts' },
  ];

  const systemGroup = [
    { id: 'events', label: 'Sự Kiện', href: '/admin/events' },
    { id: 'admins', label: 'Admins', href: '/admin/admins' },
    { id: 'settings', label: 'Cài Đặt', href: '/admin/settings' },
  ];

  const activeExpandedMenu = expandedMenu ?? autoExpandedMenu;

  const normalizePath = (path?: string | null) =>
    (path || '').replace(/\/+$/, '') || '/';

  const activeNormalized = normalizePath(activePath);

  const isActive = (itemId: string, href?: string) => {
    if (href) {
      const hrefNormalized = normalizePath(href);
      if (hrefNormalized === '/admin') {
        return activeNormalized === hrefNormalized;
      }
      return activeNormalized.startsWith(hrefNormalized);
    }
    return currentView === itemId;
  };

  const handleGroupToggle = (groupLabel: string) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedMenu(groupLabel);
    } else {
      setExpandedMenu(expandedMenu === groupLabel ? null : groupLabel);
    }
  };

  const renderItem = (item: (typeof menuItems)[number]) => {
    const active = isActive(item.id, item.href);
    const commonClasses = `
      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
      ${
        active
          ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
      }
      ${collapsed ? 'justify-center' : ''}
    `;
    const iconClass = active
      ? 'text-slate-200'
      : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-300';

    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          className={commonClasses}
          title={collapsed ? item.label : undefined}
          onClick={() => setExpandedMenu(null)}
        >
          <item.icon size={20} className={iconClass} />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => onChangeView && onChangeView(item.id)}
        className={commonClasses}
        title={collapsed ? item.label : undefined}
      >
        <item.icon size={20} className={iconClass} />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  const renderGroupItem = (item: { id: string; label: string; href: string }) => {
    const active = isActive(item.id, item.href);
    return (
      <Link
        key={item.id}
        href={item.href}
        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
          active
            ? 'text-blue-600 bg-blue-500/5 font-medium dark:text-blue-400'
            : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        onClick={() => setExpandedMenu(null)}
      >
        {item.label}
      </Link>
    );
  };

  const renderGroup = (label: string, items: { id: string; label: string; href: string }[]) => {
    const isExpanded = activeExpandedMenu === label;
    const hasActiveItem = items.some(item => isActive(item.id, item.href));

    return (
      <div key={label} className="mb-1">
        <button
          onClick={() => handleGroupToggle(label)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            hasActiveItem
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? label : undefined}
        >
          <div className={`flex items-center ${collapsed ? 'gap-0' : 'gap-3'}`}>
            <FolderOpen size={20} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </div>
          {!collapsed && (
            <ChevronRight
              size={16}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            />
          )}
        </button>
        {!collapsed && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-3 space-y-1">
              {items.map(renderGroupItem)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        h-screen sticky top-0 transition-all duration-300 z-30
      `}
    >
      {/* Logo Area */}
      <div
        className={`p-6 flex items-center ${
          collapsed ? 'justify-center' : 'justify-between'
        } border-b border-slate-100 dark:border-slate-800 h-16`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-slate-900 dark:bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              PocketTrade
            </span>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 bg-slate-900 dark:bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">P</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400
            ${collapsed ? 'hidden' : 'block'}
          `}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
        {menuItems.map(renderItem)}
        
        {!collapsed && <div className="px-3 mb-2 mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</div>}
        {renderGroup('Nội dung', contentGroup)}
        
        {!collapsed && <div className="px-3 mb-2 mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quản lý thẻ</div>}
        {renderGroup('Quản lý thẻ', cardGroup)}
        
        {!collapsed && <div className="px-3 mb-2 mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Giao dịch</div>}
        {renderGroup('Giao dịch', tradeGroup)}
        
        {!collapsed && <div className="px-3 mb-2 mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hệ thống</div>}
        {renderGroup('Hệ thống', systemGroup)}
      </nav>

      {/* Expand Button when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
