'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Home, Menu, Sun, Moon, ChevronRight, User, LogOut, Settings } from 'lucide-react';
import { useAdminSession } from '../hooks/useAdminSession';

interface HeaderProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  breadcrumbs: string[];
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isDarkMode, toggleTheme, breadcrumbs }) => {
  const { admin, logout } = useAdminSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
      
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
        <button onClick={toggleSidebar} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
          <Menu size={20} />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center text-sm text-slate-500 dark:text-slate-400">
          <span className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer">PocketTrade</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <ChevronRight size={14} className="mx-2 text-slate-400" />
              <span className={`font-medium ${index === breadcrumbs.length - 1 ? 'text-slate-900 dark:text-slate-200' : 'hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer'}`}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm (Ctrl+K)..."
            className="h-9 w-64 lg:w-80 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Home Link */}
        <a 
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Mở trang chủ"
        >
          <Home size={20} />
        </a>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300">
              {admin?.username?.slice(0, 2).toUpperCase() || 'AD'}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl py-1 border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {admin?.username || 'Admin'}
                    {admin?.isSuperAdmin && (
                      <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                        Super
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {admin?.email || ''}
                  </p>
               </div>
               
               <div className="py-1">
                 <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                    <User size={16} /> 
                    <span>Thông tin tài khoản</span>
                 </button>
                 <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                    <Settings size={16} /> 
                    <span>Cài đặt</span>
                 </button>
               </div>
               
               <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                 <button 
                   onClick={logout}
                   className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                 >
                    <LogOut size={16} /> 
                    <span>Đăng xuất</span>
                 </button>
               </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
