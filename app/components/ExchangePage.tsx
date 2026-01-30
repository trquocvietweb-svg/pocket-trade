'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Plus, Clock, ArrowRightLeft, Loader2, Filter, ChevronDown, ChevronLeft, ChevronRight, Search, X, MessageCircle, Check, XCircle, User, Share2 } from 'lucide-react';
import { useTraderAuth } from '../contexts/TraderAuthContext';
import { useLocale } from '../contexts/LocaleContext';
import EventBanner from './EventBanner';
import html2canvas from 'html2canvas';

type TabType = 'public-offers' | 'my-offers' | 'my-requests' | 'history';

const ITEMS_PER_PAGE = 24;

// Countdown Timer Component
const CountdownTimer: React.FC<{ expiresAt: number; onExpired?: () => void }> = ({ expiresAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diff = expiresAt - now;
      
      if (diff <= 0) {
        setTimeLeft('Hết hạn');
        onExpired?.();
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  return <span>{timeLeft}</span>;
};

const ExchangePage: React.FC = () => {
  const router = useRouter();
  const { trader } = useTraderAuth();
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<TabType>('public-offers');

  // Tính rank từ tradePoint
  const getRank = (tradePoint: number) => {
    if (tradePoint > 1000) return { name: t.profile.rankDiamond, color: 'text-cyan-500', bg: 'bg-cyan-50', icon: '💎' };
    if (tradePoint > 500) return { name: t.profile.rankGold, color: 'text-yellow-500', bg: 'bg-yellow-50', icon: '🥇' };
    if (tradePoint > 200) return { name: t.profile.rankSilver, color: 'text-slate-400', bg: 'bg-slate-100', icon: '🥈' };
    if (tradePoint >= 100) return { name: t.profile.rankBronze, color: 'text-orange-500', bg: 'bg-orange-50', icon: '🥉' };
    return { name: t.profile.rankIron, color: 'text-slate-500', bg: 'bg-slate-100', icon: '⚔️' };
  };

  const tabs = [
    { id: 'public-offers' as TabType, label: t.trade.public },
    { id: 'my-offers' as TabType, label: t.trade.mine },
    { id: 'my-requests' as TabType, label: t.trade.sent },
    { id: 'history' as TabType, label: t.trade.history },
  ];
  
  // Filter & Sort states
  const [showFilters, setShowFilters] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('CREATED');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  const handleFilterChange = () => setCurrentPage(1);

  // Build query args based on active tab
  const getQueryArgs = () => {
    const base = {
      limit: ITEMS_PER_PAGE,
      page: currentPage,
      sortBy,
      sortDir,
      onlineOnly: onlineOnly || undefined,
      rarity: selectedRarity || undefined,
      setName: selectedSet || undefined,
      cardName: debouncedSearch || undefined,
    };

    if (activeTab === 'public-offers') {
      return { ...base, status: 'active' };
    }
    if (activeTab === 'my-offers' && trader) {
      return { ...base, status: 'active', traderId: trader._id };
    }
    if (activeTab === 'history' && trader) {
      return { ...base, status: 'matched', traderId: trader._id };
    }
    return null;
  };

  const queryArgs = getQueryArgs();
  const tradePostsResult = useQuery(
    api.tradePosts.listPaginated,
    queryArgs || 'skip'
  );

  type TradePostItem = NonNullable<typeof tradePostsResult>['items'][number];

  const [sharePost, setSharePost] = useState<TradePostItem | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement | null>(null);

  const handleDownloadShare = async () => {
    if (!shareCardRef.current || !sharePost) return;
    setIsCapturing(true);
    try {
      const source = shareCardRef.current;
      const canvas = await html2canvas(source, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        onclone: (doc) => {
          const cloned = doc.querySelector('[data-share-capture="true"]') as HTMLElement | null;
          if (!cloned) return;
          const sourceNodes = [source, ...Array.from(source.querySelectorAll('*'))] as HTMLElement[];
          const clonedNodes = [cloned, ...Array.from(cloned.querySelectorAll('*'))] as HTMLElement[];
          sourceNodes.forEach((node, index) => {
            const target = clonedNodes[index];
            if (!target) return;
            const computed = window.getComputedStyle(node);
            target.style.color = computed.color;
            target.style.backgroundColor = computed.backgroundColor;
            target.style.borderColor = computed.borderColor;
            target.style.boxShadow = computed.boxShadow;
          });
        },
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `trade-${sharePost._id}.png`;
      link.click();
    } finally {
      setIsCapturing(false);
    }
  };

  const settings = useQuery(api.settings.get);
  const todayPostsCount = useQuery(
    api.tradePosts.countTodayPosts,
    trader ? { traderId: trader._id } : 'skip'
  );
  const todayRequestsCount = useQuery(
    api.tradeRequests.countTodayRequests,
    trader ? { traderId: trader._id } : 'skip'
  );

  const maxPostsPerDay = settings?.limitTradePostPerTrader ?? 5;
  const remainingPosts = maxPostsPerDay - (todayPostsCount ?? 0);
  const maxRequestsPerDay = settings?.limitRequestPerTraderPerDay ?? 20;
  const remainingRequests = maxRequestsPerDay - (todayRequestsCount ?? 0);

  // Outgoing requests (requests mình gửi đi)
  const outgoingRequests = useQuery(
    api.tradeRequests.listOutgoingByTrader,
    trader && activeTab === 'my-requests' ? { traderId: trader._id } : 'skip'
  );

  const rawPosts = tradePostsResult?.items ?? [];
  // Filter out expired posts on client-side for realtime update
  const posts = activeTab !== 'history'
    ? rawPosts.filter(p => !expiredIds.has(p._id))
    : rawPosts;
  const totalPages = tradePostsResult?.totalPages ?? 1;
  const total = tradePostsResult?.total ?? 0;
  const rarities = tradePostsResult?.rarities ?? [];
  const sets = tradePostsResult?.sets ?? [];

  const activeFiltersCount = [onlineOnly, selectedRarity, selectedSet].filter(Boolean).length;

  // Handle when a post expires
  const handlePostExpired = (postId: string) => {
    setExpiredIds(prev => new Set([...prev, postId]));
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Event Banner Popup */}
      <EventBanner />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="text-lg font-black text-slate-900">{t.trade.title}</h1>
        {trader && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1" title={t.trade.postsRemaining}>
              <span className="text-[10px] text-slate-500">{t.trade.post}</span>
              <span className={`text-xs font-bold ${remainingPosts > 0 ? 'text-teal-600' : 'text-red-500'}`}>
                {remainingPosts}/{maxPostsPerDay}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1" title={t.trade.request}>
              <span className="text-[10px] text-slate-500">{t.trade.request}</span>
              <span className={`text-xs font-bold ${remainingRequests > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                {remainingRequests}/{maxRequestsPerDay}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-2">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`flex-1 py-3 text-xs font-bold transition-all relative ${
                activeTab === tab.id ? 'text-teal-600' : 'text-slate-400'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters - Only show for public-offers */}
      {activeTab === 'public-offers' && (
        <div className="bg-white border-b border-slate-200 px-3 py-2 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.trade.searchByCardName}
              className="w-full h-9 pl-9 pr-8 text-sm bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {t.common.filter}
              {activeFiltersCount > 0 && (
                <span className="bg-white text-teal-600 text-[10px] font-bold px-1.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="flex items-center gap-1 ml-auto">
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [by, dir] = e.target.value.split('-');
                  setSortBy(by);
                  setSortDir(dir as 'ASC' | 'DESC');
                  handleFilterChange();
                }}
                className="text-xs bg-slate-100 border-0 rounded-lg py-1.5 pl-2 pr-6 focus:ring-2 focus:ring-teal-500"
              >
                <option value="CREATED-DESC">{t.trade.sortNewest}</option>
                <option value="EXPIRES-ASC">{t.trade.sortExpiringSoon}</option>
                <option value="EXPIRES-DESC">{t.trade.sortMostTime}</option>
              </select>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-2 space-y-2">
              {/* Online Only */}
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={onlineOnly}
                  onChange={(e) => { setOnlineOnly(e.target.checked); handleFilterChange(); }}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-slate-700">{t.trade.filterOnlineOnly}</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* Rarity Filter */}
                <div className="relative">
                  <select
                    value={selectedRarity}
                    onChange={(e) => { setSelectedRarity(e.target.value); handleFilterChange(); }}
                    className="w-full appearance-none bg-slate-100 rounded-lg py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">{t.trade.allRarities}</option>
                    {rarities.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Set Filter */}
                <div className="relative">
                  <select
                    value={selectedSet}
                    onChange={(e) => { setSelectedSet(e.target.value); handleFilterChange(); }}
                    className="w-full appearance-none bg-slate-100 rounded-lg py-2 pl-3 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">{t.trade.allSets}</option>
                    {sets.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Requests Tab - Outgoing Requests */}
      {activeTab === 'my-requests' && (
        <div className="px-3 py-3 space-y-2">
          {!trader ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-2">{t.trade.loginToView}</p>
              <p className="text-xs text-slate-400 mb-4">{t.trade.loginToViewRequests}</p>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-teal-600 text-white text-sm font-bold rounded-lg"
              >
                {t.nav.login}
              </button>
            </div>
          ) : outgoingRequests === undefined ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : outgoingRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">{t.trade.noRequestsSent}</p>
            </div>
          ) : (
            outgoingRequests.map((req) => (
              <div
                key={req._id}
                onClick={() => router.push(`/trade/${req.tradePostId}`)}
                className="bg-white rounded-xl p-3 active:bg-slate-50 transition-colors cursor-pointer border border-slate-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {req.postOwnerAvatar ? (
                      <img src={req.postOwnerAvatar} alt="" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {req.postOwnerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold text-slate-900">{req.postOwnerName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    req.status === 'accepted' ? 'bg-green-100 text-green-600' :
                    req.status === 'declined' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {req.status === 'accepted' && <><Check className="w-3 h-3 inline mr-0.5" /> {t.trade.accepted}</>}
                    {req.status === 'declined' && <><XCircle className="w-3 h-3 inline mr-0.5" /> {t.trade.declined}</>}
                    {req.status === 'pending' && t.trade.pending}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {req.offeredCard && (
                    <div className="flex items-center gap-2">
                      <img src={req.offeredCard.imageUrl} alt="" className="w-10 h-14 object-cover rounded border border-orange-200" />
                      <span className="text-[10px] text-orange-600 font-bold">{t.trade.youSend}</span>
                    </div>
                  )}
                  <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                  {req.requestedCard && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-teal-600 font-bold">{t.trade.youReceive}</span>
                      <img src={req.requestedCard.imageUrl} alt="" className="w-10 h-14 object-cover rounded border border-teal-200" />
                    </div>
                  )}
                </div>

                {req.message && (
                  <p className="mt-2 text-xs text-slate-400 truncate">&ldquo;{req.message}&rdquo;</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Trade List */}
      {activeTab !== 'my-requests' && (
      <div className="px-3 py-3 space-y-2">
        {/* Require login for personal tabs */}
        {!trader && (activeTab === 'my-offers' || activeTab === 'history') ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-2">{t.trade.loginToView}</p>
            <p className="text-xs text-slate-400 mb-4">
              {activeTab === 'my-offers' 
                ? t.trade.loginToViewPosts
                : t.trade.loginToViewHistory}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-teal-600 text-white text-sm font-bold rounded-lg"
            >
              {t.nav.login}
            </button>
          </div>
        ) : tradePostsResult === undefined ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">
              {activeTab === 'history'
                ? t.trade.noCompletedTrades
                : t.trade.noPostsYet}
            </p>
            {activeTab === 'my-offers' && trader && (
              <button
                onClick={() => router.push('/trade/new')}
                className="mt-3 px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-lg"
              >
                {t.trade.createPost}
              </button>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              onClick={() => router.push(`/trade/${post._id}`)}
              className="bg-white rounded-xl p-3 active:bg-slate-50 transition-colors cursor-pointer border border-slate-100"
            >
              {/* Header: Avatar + Name + Rank + Time */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Avatar with online badge */}
                  <div className="relative">
                    {post.traderAvatar ? (
                      <img
                        src={post.traderAvatar}
                        alt={post.traderName}
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {post.traderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Online/Offline badge */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      post.traderIsOnline ? 'bg-green-500' : 'bg-slate-300'
                    }`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{post.traderName}</span>
                    {/* Trade Point & Rank */}
                    {(() => {
                      const rank = getRank(post.traderTradePoint ?? 0);
                      return (
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold ${rank.color}`}>{rank.icon} {rank.name}</span>
                          <span className="text-[9px] text-slate-400">({post.traderTradePoint ?? 0})</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharePost(post);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200"
                  >
                    <Share2 className="w-3 h-3" />
                    {t.common.share}
                  </button>
                  {/* Request count badge - only for my-offers tab */}
                  {activeTab === 'my-offers' && post.requestsCount > 0 && (
                    <div className="flex items-center gap-1 bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">
                      <MessageCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{post.requestsCount}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {activeTab === 'history' ? (
                        t.trade.completed
                      ) : (
                        <CountdownTimer 
                          expiresAt={post.expiresAt} 
                          onExpired={() => handlePostExpired(post._id)}
                        />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cards Preview */}
              {post.haveCardsCount <= 3 && post.wantCardsCount <= 3 ? (
                <div className="mt-2 flex items-center gap-2">
                  {/* Have Cards */}
                  <div className="flex-1">
                    <div className="text-[10px] text-teal-600 font-bold mb-1">{t.trade.have} ({post.haveCardsCount})</div>
                    <div className="flex gap-1">
                      {post.haveCards.slice(0, 4).map((card) => (
                        <img
                          key={card._id}
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-10 h-14 object-cover rounded border border-teal-200"
                        />
                      ))}
                    </div>
                  </div>

                  <ArrowRightLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />

                  {/* Want Cards */}
                  <div className="flex-1">
                    <div className="text-[10px] text-blue-600 font-bold mb-1">{t.trade.want} ({post.wantCardsCount})</div>
                    <div className="flex gap-1">
                      {post.wantCards.slice(0, 4).map((card) => (
                        <img
                          key={card._id}
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-10 h-14 object-cover rounded border border-blue-200"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {/* Have Cards */}
                  <div className="rounded-lg border border-teal-100 bg-teal-50/70 p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-teal-700 font-bold">{t.trade.have}</span>
                      <span className="text-[10px] text-teal-600 font-bold">{post.haveCardsCount}</span>
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {post.haveCards.slice(0, 6).map((card) => (
                        <img
                          key={card._id}
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-10 h-14 object-cover rounded border border-teal-200 shrink-0"
                        />
                      ))}
                      {post.haveCardsCount > 6 && (
                        <div className="w-10 h-14 rounded border border-teal-200 bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">
                          +{post.haveCardsCount - 6}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-slate-300">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>

                  {/* Want Cards */}
                  <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-blue-700 font-bold">{t.trade.want}</span>
                      <span className="text-[10px] text-blue-600 font-bold">{post.wantCardsCount}</span>
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {post.wantCards.slice(0, 6).map((card) => (
                        <img
                          key={card._id}
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-10 h-14 object-cover rounded border border-blue-200 shrink-0"
                        />
                      ))}
                      {post.wantCardsCount > 6 && (
                        <div className="w-10 h-14 rounded border border-blue-200 bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                          +{post.wantCardsCount - 6}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      )}

      {/* Stats & Pagination */}
      {activeTab !== 'my-requests' && posts.length > 0 && (
        <div className="px-4 space-y-3">
          <p className="text-xs text-slate-400 font-medium">
            {t.common.total}: {total} {t.trade.totalPosts}
          </p>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                  <span key={`dots-${idx}`} className="px-2 text-slate-400 text-sm">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-teal-500 text-white'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {sharePost && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3"
          onClick={() => setSharePost(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-bold text-slate-800">{t.common.share}</h2>
              <button
                onClick={() => setSharePost(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                {t.common.close}
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div ref={shareCardRef} data-share-capture="true" className="rounded-xl border border-slate-200 p-3 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sharePost.traderAvatar ? (
                      <img
                        src={sharePost.traderAvatar}
                        alt={sharePost.traderName}
                        className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {sharePost.traderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{sharePost.traderName}</span>
                      {(() => {
                        const rank = getRank(sharePost.traderTradePoint ?? 0);
                        return (
                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] font-bold ${rank.color}`}>{rank.icon} {rank.name}</span>
                            <span className="text-[9px] text-slate-400">({sharePost.traderTradePoint ?? 0})</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {sharePost.status === 'matched' ? (
                        t.trade.completed
                      ) : (
                        <CountdownTimer expiresAt={sharePost.expiresAt} />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-teal-700 font-bold mb-2">
                    {t.trade.have} ({sharePost.haveCardsCount})
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {sharePost.haveCards.map((card) => (
                      <img
                        key={card._id}
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full aspect-[3/4] object-cover rounded border border-teal-200"
                        crossOrigin="anonymous"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center text-slate-300">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>

                <div>
                  <div className="text-[10px] text-blue-700 font-bold mb-2">
                    {t.trade.want} ({sharePost.wantCardsCount})
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {sharePost.wantCards.map((card) => (
                      <img
                        key={card._id}
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full aspect-[3/4] object-cover rounded border border-blue-200"
                        crossOrigin="anonymous"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadShare}
                disabled={isCapturing}
                className={`w-full h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  isCapturing ? 'bg-slate-100 text-slate-400' : 'bg-teal-600 text-white active:bg-teal-700'
                }`}
              >
                <Share2 className="w-4 h-4" />
                {isCapturing ? t.common.generatingImage : t.common.downloadImage}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {trader && (
        <button
          onClick={() => router.push('/trade/new')}
          className="fixed bottom-24 right-4 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-teal-600/30 active:scale-90 transition-transform z-50 md:bottom-8"
        >
          <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
        </button>
      )}
    </div>
  );
};

export default ExchangePage;
