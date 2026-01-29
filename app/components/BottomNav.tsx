'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, MessageSquare, User, ArrowLeftRight, FileText } from 'lucide-react';
import { useTraderAuth } from '../contexts/TraderAuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface BottomNavProps {
  currentView: 'library' | 'trade' | 'chat' | 'profile' | 'posts';
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView }) => {
  const { trader } = useTraderAuth();
  const settings = useQuery(api.settings.get);
  const todayPostsCount = useQuery(
    api.tradePosts.countTodayPosts,
    trader ? { traderId: trader._id } : 'skip'
  );
  const unreadCount = useQuery(
    api.messages.countUnread,
    trader ? { traderId: trader._id } : 'skip'
  );
  
  const maxPostsPerDay = settings?.limitTradePostPerTrader ?? 5;
  const remainingPosts = maxPostsPerDay - (todayPostsCount ?? 0);
  const tabs = [
    { id: 'trade', icon: ArrowLeftRight, href: '/' },
    { id: 'library', icon: LayoutGrid, href: '/library' },
    { id: 'posts', icon: FileText, href: '/bai-viet' },
    { id: 'chat', icon: MessageSquare, href: '/chat' },
    { id: 'profile', icon: User, href: '/profile' },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-teal-600 md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <Link 
            key={tab.id}
            href={tab.href}
            className={`
                relative flex flex-col items-center justify-center w-full h-full transition-all duration-300
                ${currentView === tab.id ? 'text-white' : 'text-teal-200 hover:text-white'}
            `}
          >
            {currentView === tab.id && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-b-full"></div>
            )}
            
            <div className={`
                relative p-2 transition-all duration-200
                ${currentView === tab.id ? 'scale-110' : ''}
            `}>
              <tab.icon className={`w-6 h-6 ${currentView === tab.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              
              {tab.id === 'trade' && trader && (
                <span className={`
                  absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center
                  text-[9px] font-bold rounded-full px-1
                  ${remainingPosts > 0 
                    ? 'bg-amber-400 text-amber-900' 
                    : 'bg-red-500 text-white'}
                `}>
                  {remainingPosts}
                </span>
              )}
              
              {tab.id === 'chat' && trader && (unreadCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold rounded-full px-1 bg-pink-500 text-white animate-pulse">
                  {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
