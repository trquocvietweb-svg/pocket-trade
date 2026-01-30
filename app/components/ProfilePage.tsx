/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Copy, Hexagon, RefreshCcw, Plus, LogIn, LogOut, UserPlus, X, Check, Loader2, ChevronRight, Clock, MessageSquare } from 'lucide-react';
import { useTraderAuth } from '../contexts/TraderAuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { AVATARS } from './AvatarSelect';
import LocaleSwitcher from './LocaleSwitcher';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { trader, logout, isLoading, refreshTrader } = useTraderAuth();
  const { t } = useLocale();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editFriendCode, setEditFriendCode] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState(AVATARS[0].url);
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);

  const updateProfile = useMutation(api.traders.updateProfile);
  
  const myPosts = useQuery(
    api.tradePosts.listPaginated,
    trader ? { limit: 50, traderId: trader._id } : 'skip'
  );

  const outgoingRequests = useQuery(
    api.tradeRequests.listOutgoingByTrader,
    trader ? { traderId: trader._id } : 'skip'
  );

  const getRankInfo = (points: number) => {
    if (points >= 100) return { name: t.profile.rankDiamond, color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
    if (points >= 50) return { name: t.profile.rankGold, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (points >= 20) return { name: t.profile.rankSilver, color: 'text-slate-300', bg: 'bg-slate-400/20' };
    if (points >= 5) return { name: t.profile.rankBronze, color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { name: t.profile.rankIron, color: 'text-slate-400', bg: 'bg-slate-500/20' };
  };

  const copyFriendCode = () => {
    if (trader?.friendCode) {
      navigator.clipboard.writeText(trader.friendCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const openEditModal = () => {
    if (!trader) return;
    setEditName(trader.name);
    setEditFriendCode(trader.friendCode || '');
    setEditAvatarUrl(trader.avatarUrl || AVATARS[0].url);
    setEditError('');
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!trader) return;
    if (!editName.trim()) {
      setEditError(t.profile.nameRequired);
      return;
    }
    
    setIsSaving(true);
    setEditError('');
    
    try {
      await updateProfile({
        id: trader._id,
        name: editName.trim(),
        friendCode: editFriendCode.trim() || undefined,
        avatarUrl: editAvatarUrl,
      });
      await refreshTrader();
      setIsEditOpen(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setEditError(error.message);
      } else {
        setEditError(t.common.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (mins < 1) return t.common.justNow;
    if (hours < 1) return `${mins} ${t.common.minutesAgo}`;
    if (hours < 24) return `${hours} ${t.common.hoursAgo}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t.common.daysAgo}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">{t.profile.active}</span>;
      case 'matched':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">{t.profile.matched}</span>;
      case 'expired':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 rounded-full">{t.profile.expired}</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 pb-20">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-teal-50 rounded-full flex items-center justify-center">
            <LogIn className="w-12 h-12 text-teal-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 mb-2">{t.profile.welcome}</h2>
            <p className="text-slate-500 text-sm">{t.profile.welcomeDesc}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-teal-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-teal-600 transition-colors"
            >
              <LogIn size={20} />
              {t.nav.login}
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
            >
              <UserPlus size={20} />
              {t.profile.createAccount}
            </Link>
          </div>
          <LocaleSwitcher variant="full" />
        </div>
      </div>
    );
  }

  const rankInfo = getRankInfo(trader.tradePoint ?? 0);
  const allPosts = myPosts?.items || [];
  const activePosts = allPosts.filter(p => p.status === 'active');
  const matchedPosts = allPosts.filter(p => p.status === 'matched');
  const visiblePosts = showAllPosts ? allPosts : activePosts;
  const sortedVisiblePosts = [...visiblePosts].sort((a, b) => b._creationTime - a._creationTime);
  const newestPostId = sortedVisiblePosts[0]?._id;
  const pendingRequestsTotal = activePosts.reduce((sum, post) => sum + (post.requestsCount ?? 0), 0);
  const pendingOutgoingRequests = (outgoingRequests || []).filter(req => req.status === 'pending');

  return (
    <div className="min-h-screen bg-[#0a1128] pb-20">
      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">{t.profile.editProfile}</h2>
              <button onClick={() => setIsEditOpen(false)} className="p-1">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {editError}
                </div>
              )}
              
              {/* Avatar Select */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.profile.selectAvatar}</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 p-3 bg-slate-50 rounded-xl max-h-48 overflow-y-auto">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setEditAvatarUrl(avatar.url)}
                      className={`p-1.5 rounded-lg transition-all ${
                        editAvatarUrl === avatar.url
                          ? 'bg-teal-500 ring-2 ring-teal-500 ring-offset-2'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      <Image
                        src={avatar.url}
                        alt={avatar.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover mx-auto"
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">{t.profile.displayName} *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              {/* Friend Code */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">{t.profile.friendCodeDesc}</label>
                <input
                  type="text"
                  value={editFriendCode}
                  onChange={(e) => setEditFriendCode(e.target.value.replace(/[^0-9-]/g, ''))}
                  placeholder={t.profile.friendCodeExample}
                  className="w-full bg-slate-50 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.common.saving}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t.common.saveChanges}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="px-5 pt-12 pb-8 space-y-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full border-4 border-teal-500/30 p-1 bg-gradient-to-tr from-teal-500/20 to-transparent">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border border-white/10 flex items-center justify-center">
                <Image 
                    src={trader.avatarUrl || AVATARS[0].url}
                    alt="avatar" 
                    width={88}
                    height={88}
                    className="w-full h-full object-cover scale-110" 
                />
              </div>
            </div>
            <button 
              onClick={openEditModal}
              className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-xl border border-slate-100 active:scale-90 transition-transform"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-800" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">{trader.name}</h2>
              <Hexagon className="w-4 h-4 text-teal-400 fill-teal-400/10" />
            </div>
            
            <div className="flex flex-col gap-3">
                {trader.friendCode && (
                  <div className="flex items-center gap-2 text-white/60 text-[11px] font-bold">
                      <span>Friend ID: {trader.friendCode}</span>
                      <button onClick={copyFriendCode} className="hover:text-white transition-colors">
                        {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                  </div>
                )}
                
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 font-black uppercase tracking-wider mb-0.5">{t.profile.tradePoint}</span>
                        <span className="text-xs text-white font-black tracking-tight">{(trader.tradePoint ?? 0).toLocaleString()} {t.profile.points}</span>
                    </div>
                    
                    <div className="w-[1px] h-6 bg-white/10"></div>
                    
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 font-black uppercase tracking-wider mb-0.5">{t.profile.rank}</span>
                        <span className={`text-xs font-black tracking-tight uppercase ${rankInfo.color}`}>{rankInfo.name}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors"
          >
            <LogOut size={16} />
            {t.nav.logout}
          </button>
          <LocaleSwitcher variant="full" className="text-white" />
        </div>
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-t-[2.5rem] min-h-[calc(100vh-280px)]">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{t.profile.managePosts}</h3>
            </div>
            <div className="flex items-center gap-2">
                {pendingRequestsTotal > 0 && (
                  <div className="bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-sm">
                    {pendingRequestsTotal} {t.trade.requests}
                  </div>
                )}
                <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase">
                    {t.common.total}: {myPosts?.total ?? 0}
                </div>
            </div>
        </div>
        <div className="px-6 pb-4">
          <div className="inline-flex items-center bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setShowAllPosts(false)}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded-full transition-colors ${
                !showAllPosts ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {t.profile.active}
            </button>
            <button
              onClick={() => setShowAllPosts(true)}
              className={`px-3 py-1 text-[10px] font-black uppercase rounded-full transition-colors ${
                showAllPosts ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {t.common.all}
            </button>
          </div>
        </div>

        {myPosts === undefined ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 px-6">
            <div className="text-center space-y-2 max-w-[240px]">
              <h4 className="text-sm font-black text-slate-800">{t.profile.startTrading}</h4>
              <p className="text-[12px] font-bold text-slate-400 leading-tight">{t.profile.noPostsDesc}</p>
            </div>

            <button 
              onClick={() => router.push('/trade/new')}
              className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl hover:bg-teal-600 transition-all active:scale-95"
            >
              <div className="bg-teal-500 rounded-lg p-1 group-hover:bg-white transition-colors">
                <Plus className="w-4 h-4 stroke-[4px] group-hover:text-teal-600" />
              </div>
              {t.profile.createNewPost}
            </button>
          </div>
        ) : (
          <div className="px-4 pb-8 space-y-6">
            {/* Outgoing Requests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-xs font-black uppercase text-slate-400">{t.trade.sent} • {t.trade.pending}</h4>
                <span className="text-[10px] font-black text-slate-400">{pendingOutgoingRequests.length}</span>
              </div>

              {outgoingRequests === undefined ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                </div>
              ) : pendingOutgoingRequests.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-slate-400 font-bold">
                  {t.trade.noRequestsSent}
                </div>
              ) : (
                pendingOutgoingRequests.map((req) => (
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-600">
                        {t.trade.pending}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {req.offeredCard && (
                        <div className="flex items-center gap-2">
                          <img src={req.offeredCard.imageUrl} alt="" className="w-10 h-14 object-cover rounded border border-orange-200" />
                          <span className="text-[10px] text-orange-600 font-bold">{t.trade.youSend}</span>
                        </div>
                      )}
                      <div className="w-px h-10 bg-slate-200" />
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

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(req._creationTime)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-green-600">{activePosts.length}</p>
                <p className="text-[10px] text-green-600/70 font-bold">{t.profile.active}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-blue-600">{matchedPosts.length}</p>
                <p className="text-[10px] text-blue-600/70 font-bold">{t.profile.matched}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-slate-600">{(myPosts?.total ?? 0) - activePosts.length - matchedPosts.length}</p>
                <p className="text-[10px] text-slate-500 font-bold">{t.profile.expired}</p>
              </div>
            </div>

            {/* Post List */}
            <div className="space-y-3">
              {sortedVisiblePosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/trade/${post._id}`}
                  className="block bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {/* Cards Preview */}
                    <div className="flex -space-x-2">
                      {post.haveCards.slice(0, 2).map((card, i) => (
                        <img 
                          key={card._id}
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-10 h-14 object-cover rounded border-2 border-white shadow-sm"
                          style={{ zIndex: 2 - i }}
                        />
                      ))}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(post.status)}
                        {post._id === newestPostId && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-700 rounded-full">
                            {t.trade.sortNewest}
                          </span>
                        )}
                        {post.requestsCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post.requestsCount} {t.trade.requests}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-600 truncate">
                        <span className="font-bold text-teal-600">{t.trade.have}:</span>{' '}
                        {post.haveCards.map(c => c.name).join(', ')}
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        <span className="font-bold text-orange-600">{t.trade.want}:</span>{' '}
                        {post.wantCards.map(c => c.name).join(', ')}
                      </p>
                      
                      {post.note && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate italic">{post.note}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(post._creationTime)}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Create New Button */}
            <button 
              onClick={() => router.push('/trade/new')}
              className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.profile.createNewPost}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
