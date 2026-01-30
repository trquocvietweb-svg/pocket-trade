/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Clock, Loader2, ArrowRightLeft } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { AVATARS } from './AvatarSelect';

interface CardDetailProps {
  cardId: Id<"cards">;
  onBack: () => void;
}

const getRank = (tradePoint: number) => {
  if (tradePoint >= 100) return { name: 'Kim Cương', color: 'text-cyan-500', icon: '💎' };
  if (tradePoint >= 50) return { name: 'Vàng', color: 'text-yellow-500', icon: '🥇' };
  if (tradePoint >= 20) return { name: 'Bạc', color: 'text-slate-400', icon: '🥈' };
  if (tradePoint >= 5) return { name: 'Đồng', color: 'text-orange-500', icon: '🥉' };
  return { name: 'Sắt', color: 'text-slate-500', icon: '⚔️' };
};

const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Vừa xong';
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const CardDetail: React.FC<CardDetailProps> = ({ cardId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'seeking' | 'offering'>('seeking');

  const card = useQuery(api.cards.getByIdEnriched, { id: cardId });
  
  // Người đang tìm card này = card nằm trong wantCards của họ
  const seekingPosts = useQuery(api.tradePosts.listByCard, { cardId, type: 'want', limit: 20 });
  
  // Người đang có card này = card nằm trong haveCards của họ
  const offeringPosts = useQuery(api.tradePosts.listByCard, { cardId, type: 'have', limit: 20 });

  if (card === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy thẻ</h1>
          <button onClick={onBack} className="text-teal-600 font-medium hover:underline">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentPosts = activeTab === 'seeking' ? seekingPosts : offeringPosts;
  const isLoading = currentPosts === undefined;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1">
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-sm font-bold text-slate-800">Chi tiết thẻ</h1>
      </div>

      {/* Card Info */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-4">
          <div className="w-24 h-32 shrink-0 rounded-lg overflow-hidden border border-slate-100 shadow-md">
            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">{card.name}</h2>
              {card.subtype && (
                <p className="text-xs text-slate-500">{card.subtype}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {card.rarityImageUrl && (
                  <img src={card.rarityImageUrl} alt={card.rarityName} className="h-4" />
                )}
                <span className="text-xs text-slate-400">{card.rarityName}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-1 text-[10px] font-bold bg-teal-50 text-teal-700 rounded-full">
                {card.setName || card.packName}
              </span>
              <span className="text-[10px] text-slate-400">#{card.cardNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-y">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('seeking')}
            className={`flex-1 py-4 text-xs font-bold transition-all relative ${
              activeTab === 'seeking' ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            Đang tìm thẻ này ({seekingPosts?.length ?? 0})
            {activeTab === 'seeking' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('offering')}
            className={`flex-1 py-4 text-xs font-bold transition-all relative ${
              activeTab === 'offering' ? 'text-slate-900' : 'text-slate-400'
            }`}
          >
            Đang có thẻ này ({offeringPosts?.length ?? 0})
            {activeTab === 'offering' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-teal-500 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="px-4 py-3 text-xs text-slate-500 text-center italic">
        {activeTab === 'seeking' 
          ? `Những người này đang cần ${card.name}, xem thẻ họ sẵn sàng đổi:`
          : `Những người này đang có ${card.name}, xem thẻ họ muốn nhận:`
        }
      </p>

      {/* Posts List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : currentPosts && currentPosts.length > 0 ? (
          currentPosts.map((post) => {
            if (!post) return null;
            const rank = getRank(post.traderTradePoint);
            const displayCards = activeTab === 'seeking' ? post.haveCards : post.wantCards;
            
            return (
              <Link
                key={post._id}
                href={`/trade/${post._id}`}
                className="block bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Trader Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100">
                        <Image
                          src={post.traderAvatar || AVATARS[0].url}
                          alt={post.traderName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {post.traderIsOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{post.traderName}</span>
                        <span className="text-[10px]" title={rank.name}>{rank.icon}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(post._creationTime)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-teal-600 text-xs font-bold">
                    <ArrowRightLeft className="w-4 h-4" />
                    Xem
                  </div>
                </div>

                {/* Cards they have/want */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                    {activeTab === 'seeking' ? 'Thẻ họ có thể đổi:' : 'Thẻ họ muốn nhận:'}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {displayCards?.filter(Boolean).slice(0, 5).map((c) => (
                      <div key={c!._id} className="shrink-0 w-12">
                        <div className="aspect-[3/4] rounded overflow-hidden border border-slate-100">
                          <img src={c!.imageUrl} alt={c!.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[8px] text-slate-500 truncate text-center mt-0.5">{c!.name}</p>
                      </div>
                    ))}
                    {displayCards && displayCards.filter(Boolean).length > 5 && (
                      <div className="shrink-0 w-12 aspect-[3/4] bg-slate-100 rounded flex items-center justify-center">
                        <span className="text-xs text-slate-400 font-bold">+{displayCards.length - 5}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Note */}
                {post.note && (
                  <p className="mt-2 text-[10px] text-slate-400 italic truncate">&quot;{post.note}&quot;</p>
                )}
              </Link>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <ArrowRightLeft className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">Chưa có bài đăng</p>
            <p className="text-xs text-slate-400">
              {activeTab === 'seeking' 
                ? 'Chưa có ai đang tìm thẻ này'
                : 'Chưa có ai đang có thẻ này để đổi'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDetail;
