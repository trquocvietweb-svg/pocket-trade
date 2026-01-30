/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTraderAuth } from '../contexts/TraderAuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { Search, Loader2, MessageSquare, ArrowDownToLine, ArrowUpFromLine, Check, X, LogIn } from 'lucide-react';

interface ChatPageProps {
  onChatClick?: (chat: { id: string }) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ onChatClick }) => {
  const router = useRouter();
  const { trader } = useTraderAuth();
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = React.useState('');

  // Tính rank từ tradePoint
  const getRank = (tradePoint: number) => {
    if (tradePoint > 1000) return { name: t.profile.rankDiamond, color: 'text-cyan-500', bg: 'bg-cyan-50' };
    if (tradePoint > 500) return { name: t.profile.rankGold, color: 'text-yellow-500', bg: 'bg-yellow-50' };
    if (tradePoint > 200) return { name: t.profile.rankSilver, color: 'text-slate-400', bg: 'bg-slate-100' };
    if (tradePoint >= 100) return { name: t.profile.rankBronze, color: 'text-orange-500', bg: 'bg-orange-50' };
    return { name: t.profile.rankIron, color: 'text-slate-500', bg: 'bg-slate-100' };
  };

  // Format time ago
  const timeAgo = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const chats = useQuery(
    api.chats.listByTrader,
    trader ? { traderId: trader._id } : 'skip'
  );

  const filteredChats = chats?.filter((chat) =>
    chat.partner?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!trader) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="sticky top-0 z-50 bg-white px-4 py-5 flex items-center justify-center border-b border-slate-50">
          <h1 className="text-lg font-black text-slate-800 tracking-tight">{t.chat.title}</h1>
        </div>
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">{t.chat.loginToChat}</h2>
          <p className="text-sm text-slate-400 text-center mb-6">{t.chat.loginToChatDesc}</p>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            {t.nav.login}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-50 bg-white px-4 py-5 flex items-center justify-center border-b border-slate-50">
        <h1 className="text-lg font-black text-slate-800 tracking-tight">{t.chat.title}</h1>
      </div>

      <div className="px-4 py-3 bg-slate-50/50">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.chat.searchMessages}
            className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all shadow-sm"
          />
        </div>
      </div>

      {chats === undefined ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      ) : filteredChats?.length === 0 ? (
        <div className="text-center py-12 px-4">
          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{t.chat.noConversations}</p>
          <p className="text-xs text-slate-300 mt-1">{t.chat.whenAccepted}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {filteredChats?.map((chat) => {
            const rank = getRank(chat.partner?.tradePoint ?? 0);
            const statusTag = chat.status === 'completed'
              ? { label: t.chat.completed, type: 'success' }
              : chat.status === 'cancelled'
                ? { label: t.chat.cancelled, type: 'muted' }
                : null;

            return (
              <div
                key={chat._id}
                onClick={() => onChatClick?.({ id: chat._id })}
                className="px-4 py-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer group"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                    {chat.partner?.avatarUrl ? (
                      <img src={chat.partner.avatarUrl} alt={chat.partner.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-500">
                        {chat.partner?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Online indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${chat.partner?.isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>

                <div className="flex-grow min-w-0 pt-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="text-[14px] font-black text-slate-800 truncate tracking-tight">
                        {chat.partner?.name}
                      </h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${rank.bg} ${rank.color}`}>
                        {rank.name}
                      </span>
                    </div>
                    {chat.lastMessage && (
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        {timeAgo(chat.lastMessage._creationTime)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium text-slate-400 truncate leading-tight">
                      {chat.lastMessage
                        ? chat.lastMessage.contentType === 'image'
                          ? `📷 ${t.chat.image}`
                          : chat.lastMessage.content
                        : t.chat.noMessages}
                    </p>
                    {chat.unreadCount > 0 && (
                      <div className="min-w-[18px] h-[18px] flex items-center justify-center bg-pink-500 text-white text-[9px] font-black rounded-full px-1 shadow-[0_2px_8px_rgba(236,72,153,0.3)]">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>

                  {statusTag && (
                    <div className="mt-2 inline-flex">
                      <div className={`
                        px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 border
                        ${statusTag.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : ''}
                        ${statusTag.type === 'muted' ? 'bg-slate-100 border-slate-200 text-slate-500' : ''}
                      `}>
                        {statusTag.type === 'success' && <Check className="w-3 h-3 stroke-[3px]" />}
                        {statusTag.type === 'muted' && <X className="w-3 h-3 stroke-[3px]" />}
                        {statusTag.label}
                      </div>
                    </div>
                  )}

                  {chat.tradePreview.offeredCard && chat.tradePreview.requestedCard && (
                    <div className="mt-3 flex gap-2">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                        <ArrowDownToLine className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate max-w-[80px]">
                          {chat.tradePreview.requestedCard.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                        <ArrowUpFromLine className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate max-w-[80px]">
                          {chat.tradePreview.offeredCard.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatPage;
