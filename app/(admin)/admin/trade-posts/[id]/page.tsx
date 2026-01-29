'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, CreditCard, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  matched: { label: 'Đã match', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  expired: { label: 'Hết hạn', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const requestStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  accepted: { label: 'Đã chấp nhận', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  declined: { label: 'Đã từ chối', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function RequestsSection({ postId, count }: { postId: Id<"tradePosts">; count: number }) {
  const requests = useQuery(api.tradeRequests.listByPost, { tradePostId: postId });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Trade Requests ({count})
      </h2>
      {requests === undefined ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-slate-400 text-sm">Chưa có request nào</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const reqStatus = requestStatusConfig[req.status] || requestStatusConfig.pending;
            return (
              <div key={req._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {req.requesterAvatar ? (
                      <img src={req.requesterAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500">
                        {req.requesterName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">{req.requesterName}</p>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${req.requesterIsOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-xs text-slate-500">{req.requesterIsOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${reqStatus.color}`}>
                    {reqStatus.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  {req.offeredCard && (
                    <div className="flex items-center gap-2">
                      <img src={req.offeredCard.imageUrl} alt={req.offeredCard.name} className="w-12 h-16 object-cover rounded border border-orange-300" />
                      <div>
                        <p className="text-[10px] text-orange-600 font-bold">OFFER</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{req.offeredCard.name}</p>
                      </div>
                    </div>
                  )}
                  <span className="text-slate-300">→</span>
                  {req.requestedCard && (
                    <div className="flex items-center gap-2">
                      <img src={req.requestedCard.imageUrl} alt={req.requestedCard.name} className="w-12 h-16 object-cover rounded border border-teal-300" />
                      <div>
                        <p className="text-[10px] text-teal-600 font-bold">WANT</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{req.requestedCard.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {req.message && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded p-2">
                    "{req.message}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TradePostDetailPage() {
  const params = useParams();
  const postId = params.id as Id<"tradePosts">;
  
  const tradePost = useQuery(api.tradePosts.getById, { id: postId });
  const updateStatus = useMutation(api.tradePosts.updateStatus);
  const toggleHidden = useMutation(api.tradePosts.toggleHidden);

  if (tradePost === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!tradePost) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy bài đăng</p>
        <Link href="/admin/trade-posts" className="text-indigo-600 hover:underline mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const status = statusConfig[tradePost.status] || statusConfig.active;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/trade-posts"
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chi tiết Trade Post</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">#{tradePost._id.slice(-8)}</p>
        </div>
        <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Have Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-green-500" />
              Thẻ có (Have) - {tradePost.haveCards.length}
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {tradePost.haveCards.map((card) => (
                <div key={card._id} className="group relative">
                  <img 
                    src={card.imageUrl} 
                    alt={card.name}
                    className="w-full aspect-[3/4] object-cover rounded-lg border-2 border-green-300 dark:border-green-600"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                    <p className="text-white text-[10px] text-center font-medium">{card.name}</p>
                  </div>
                </div>
              ))}
              {tradePost.haveCards.length === 0 && (
                <p className="col-span-full text-slate-400 text-sm">Không có thẻ</p>
              )}
            </div>
          </div>

          {/* Want Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-500" />
              Thẻ cần (Want) - {tradePost.wantCards.length}
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {tradePost.wantCards.map((card) => (
                <div key={card._id} className="group relative">
                  <img 
                    src={card.imageUrl} 
                    alt={card.name}
                    className="w-full aspect-[3/4] object-cover rounded-lg border-2 border-blue-300 dark:border-blue-600"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                    <p className="text-white text-[10px] text-center font-medium">{card.name}</p>
                  </div>
                </div>
              ))}
              {tradePost.wantCards.length === 0 && (
                <p className="col-span-full text-slate-400 text-sm">Không có thẻ</p>
              )}
            </div>
          </div>

          {/* Requests */}
          <RequestsSection postId={postId} count={tradePost.requestsCount} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trader Info */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={20} />
              Thông tin Trader
            </h2>
            {tradePost.trader ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {tradePost.trader.avatarUrl ? (
                    <img src={tradePost.trader.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-500">
                      {tradePost.trader.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{tradePost.trader.name}</p>
                    <p className="text-sm text-slate-500">{tradePost.trader.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Legit Point</p>
                  <p className="font-medium text-slate-900 dark:text-white">{tradePost.trader.legitPoint}</p>
                </div>
                {tradePost.trader.friendCode && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Friend Code</p>
                    <p className="font-medium text-slate-900 dark:text-white font-mono">{tradePost.trader.friendCode}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-400">Không tìm thấy thông tin trader</p>
            )}
          </div>

          {/* Post Info */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Thông tin Post</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tạo lúc</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatDate(tradePost._creationTime)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Hết hạn</p>
                <p className="font-medium text-slate-900 dark:text-white">{formatDate(tradePost.expiresAt)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Trạng thái ẩn</p>
                <p className="font-medium text-slate-900 dark:text-white">{tradePost.isHidden ? 'Đang ẩn' : 'Hiển thị'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Hành động</h2>
            
            <button
              onClick={() => toggleHidden({ id: postId })}
              className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {tradePost.isHidden ? 'Hiện bài đăng' : 'Ẩn bài đăng'}
            </button>

            <select
              value={tradePost.status}
              onChange={(e) => updateStatus({ id: postId, status: e.target.value })}
              className="w-full px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Đang hoạt động</option>
              <option value="matched">Đã match</option>
              <option value="expired">Hết hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
