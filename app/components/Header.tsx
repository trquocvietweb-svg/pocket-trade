'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, MessageSquare, User, ArrowLeftRight, LogIn, LogOut, FileText } from 'lucide-react';
import { useTraderAuth } from '../contexts/TraderAuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import LocaleSwitcher from './LocaleSwitcher';

interface HeaderProps {
  currentView: 'library' | 'trade' | 'chat' | 'profile' | 'posts';
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { trader, logout, isLoading } = useTraderAuth();
  const { t } = useLocale();
  const settings = useQuery(api.settings.get);
  const todayPostsCount = useQuery(
    api.tradePosts.countTodayPosts,
    trader ? { traderId: trader._id } : 'skip'
  );
  
  const maxPostsPerDay = settings?.limitTradePostPerTrader ?? 5;
  const remainingPosts = maxPostsPerDay - (todayPostsCount ?? 0);

  const navItems = [
    { id: 'trade', label: t.nav.trade, icon: ArrowLeftRight, href: '/' },
    { id: 'library', label: t.nav.library, icon: LayoutGrid, href: '/library' },
    { id: 'posts', label: t.nav.posts, icon: FileText, href: '/bai-viet' },
    { id: 'chat', label: t.nav.chat, icon: MessageSquare, href: '/chat' },
    { id: 'profile', label: t.nav.profile, icon: User, href: '/profile' },
  ] as const;

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-teal-600 border-b border-teal-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="w-40" />
          
          <nav className="flex items-center gap-4 h-full">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  relative flex items-center gap-2 px-4 h-full transition-all duration-200 group
                  text-[11px] font-bold tracking-[0.12em]
                  ${currentView === item.id 
                    ? 'text-white' 
                    : 'text-teal-100 hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon 
                  className={`w-4 h-4 transition-transform duration-200 ${currentView === item.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} 
                />
                
                <span>{item.label}</span>

                {item.id === 'trade' && trader && (
                  <span className={`
                    ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full
                    ${remainingPosts > 0 
                      ? 'bg-amber-400 text-amber-900' 
                      : 'bg-red-500 text-white'}
                  `}>
                    {remainingPosts}/{maxPostsPerDay}
                  </span>
                )}

                {currentView === item.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t-sm shadow-[0_-2px_6px_rgba(255,255,255,0.3)]" />
                )}
              </Link>
            ))}
          </nav>

          <div className="w-40 flex justify-end items-center gap-2">
            <LocaleSwitcher />
            {!isLoading && (
              trader ? (
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm font-medium truncate max-w-24">
                    {trader.name}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-colors"
                  >
                    <LogOut size={14} />
                    {t.nav.logout}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-teal-600 rounded-lg text-xs font-bold hover:bg-teal-50 transition-colors"
                >
                  <LogIn size={14} />
                  {t.nav.login}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
