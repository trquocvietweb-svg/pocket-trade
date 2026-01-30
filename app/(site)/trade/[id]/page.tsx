/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ChevronLeft, Clock, ArrowRightLeft, Loader2, Send, Check, XCircle } from 'lucide-react';
import { useTraderAuth } from '../../../contexts/TraderAuthContext';

const formatTimeLeft = (expiresAt: number) => {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Hết hạn';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
};

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { trader } = useTraderAuth();
  const postId = params.id as Id<"tradePosts">;

  const [selectedHaveCard, setSelectedHaveCard] = useState<string | null>(null);
  const [selectedWantCard, setSelectedWantCard] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tradePost = useQuery(api.tradePosts.getById, { id: postId });
  const requests = useQuery(api.tradeRequests.listByPost, { tradePostId: postId });
  const createRequest = useMutation(api.tradeRequests.create);
  const updateRequestStatus = useMutation(api.tradeRequests.updateStatus);

  if (tradePost === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!tradePost) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <p className="text-slate-500 mb-4">Không tìm thấy bài đăng</p>
        <button onClick={() => router.back()} className="text-teal-600 font-medium">
          Quay lại
        </button>
      </div>
    );
  }

  const isOwner = trader && tradePost.trader?._id === trader._id;
  const isExpired = tradePost.expiresAt < Date.now();
  const canSendRequest = trader && !isOwner && tradePost.status === 'active' && !isExpired;
  const canSubmit = selectedHaveCard && selectedWantCard;

  const handleSendRequest = async () => {
    if (!trader || !selectedHaveCard || !selectedWantCard) return;

    setIsSubmitting(true);
    try {
      await createRequest({
        tradePostId: postId,
        requesterId: trader._id,
        requestedCardId: selectedHaveCard as Id<"cards">,
        offeredCardId: selectedWantCard as Id<"cards">,
        message: message || undefined,
      });
      setSelectedHaveCard(null);
      setSelectedWantCard(null);
      setMessage('');
      alert('Đã gửi yêu cầu thành công!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRequest = async (requestId: Id<"tradeRequests">, status: string) => {
    if (!trader) return;
    try {
      const result = await updateRequestStatus({ id: requestId, status, traderId: trader._id });
      // Nếu chấp nhận, chuyển ngay sang chat
      if (status === 'accepted' && result?.chatId) {
        router.push(`/chat/${result.chatId}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  };

  const pendingRequests = requests?.filter(r => r.status === 'pending') ?? [];
  const otherRequests = requests?.filter(r => r.status !== 'pending') ?? [];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-sm font-bold text-slate-800 flex-1">Chi tiết giao dịch</h1>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{formatTimeLeft(tradePost.expiresAt)}</span>
        </div>
      </div>

      {/* Trader Info */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            {tradePost.trader?.avatarUrl ? (
              <img src={tradePost.trader.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                {tradePost.trader?.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              tradePost.trader?.isOnline ? 'bg-green-500' : 'bg-slate-300'
            }`} />
          </div>
          <div>
            <p className="font-bold text-slate-900">{tradePost.trader?.name}</p>
            <p className="text-xs text-slate-400">
              {tradePost.trader?.tradePoint ?? 0} điểm uy tín
              {tradePost.trader?.friendCode && ` • ${tradePost.trader.friendCode}`}
            </p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="p-3 space-y-3">
        {/* Have Cards - Thẻ bạn muốn lấy */}
        <div className="bg-white rounded-xl p-3">
          <h2 className="text-xs font-bold text-teal-600 uppercase mb-2">
            Thẻ họ có - Chọn 1 thẻ bạn muốn ({tradePost.haveCards.length})
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
            {tradePost.haveCards.map(card => {
              const isSelected = selectedHaveCard === card._id;
              return (
                <button
                  key={card._id}
                  onClick={() => canSendRequest && setSelectedHaveCard(isSelected ? null : card._id)}
                  disabled={!canSendRequest}
                  className={`relative rounded overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-teal-500 ring-offset-1' : ''
                  } ${canSendRequest ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                >
                  <img 
                    src={card.imageUrl} 
                    alt={card.name} 
                    className="w-full aspect-[3/4] object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-teal-500/30 flex items-center justify-center">
                      <div className="bg-teal-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="bg-slate-200 rounded-full p-1.5">
            <ArrowRightLeft className="w-3 h-3 text-slate-500" />
          </div>
        </div>

        {/* Want Cards - Thẻ bạn sẽ cho */}
        <div className="bg-white rounded-xl p-3">
          <h2 className="text-xs font-bold text-blue-600 uppercase mb-2">
            Thẻ họ cần - Chọn 1 thẻ bạn sẽ cho ({tradePost.wantCards.length})
          </h2>
          <div className="grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
            {tradePost.wantCards.map(card => {
              const isSelected = selectedWantCard === card._id;
              return (
                <button
                  key={card._id}
                  onClick={() => canSendRequest && setSelectedWantCard(isSelected ? null : card._id)}
                  disabled={!canSendRequest}
                  className={`relative rounded overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                  } ${canSendRequest ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                >
                  <img 
                    src={card.imageUrl} 
                    alt={card.name} 
                    className="w-full aspect-[3/4] object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                      <div className="bg-blue-500 rounded-full p-1">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Requests Section - Only for owner */}
        {isOwner && (
          <div className="bg-white rounded-xl p-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase mb-2">
              Yêu cầu giao dịch ({requests?.length ?? 0})
            </h2>

            {pendingRequests.length === 0 && otherRequests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có yêu cầu nào</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req._id} className="border border-amber-200 bg-amber-50 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative">
                        {req.requesterAvatar ? (
                          <img src={req.requesterAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                            {req.requesterName.charAt(0)}
                          </div>
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-amber-50 ${
                          req.requesterIsOnline ? 'bg-green-500' : 'bg-slate-300'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{req.requesterName}</p>
                        <p className="text-[10px] text-amber-600 font-medium">Đang chờ</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 text-center">
                        <p className="text-[9px] text-slate-500 mb-0.5">Muốn nhận</p>
                        {req.requestedCard && (
                          <img src={req.requestedCard.imageUrl} alt="" className="w-10 h-14 object-cover rounded mx-auto border border-teal-200" />
                        )}
                      </div>
                      <ArrowRightLeft className="w-3 h-3 text-slate-300 flex-shrink-0" />
                      <div className="flex-1 text-center">
                        <p className="text-[9px] text-slate-500 mb-0.5">Sẽ đưa</p>
                        {req.offeredCard && (
                          <img src={req.offeredCard.imageUrl} alt="" className="w-10 h-14 object-cover rounded mx-auto border border-blue-200" />
                        )}
                      </div>
                    </div>

                    {req.message && (
                      <p className="text-[10px] text-slate-600 mb-2 italic truncate">&quot;{req.message}&quot;</p>
                    )}

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUpdateRequest(req._id, 'accepted')}
                        className="flex-1 py-1.5 bg-green-500 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Chấp nhận
                      </button>
                      <button
                        onClick={() => handleUpdateRequest(req._id, 'declined')}
                        className="flex-1 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}

                {otherRequests.map(req => (
                  <div key={req._id} className={`border rounded-lg p-2 ${
                    req.status === 'accepted' ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      {req.requesterAvatar ? (
                        <img src={req.requesterAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                          {req.requesterName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{req.requesterName}</p>
                        <p className={`text-[10px] font-medium ${
                          req.status === 'accepted' ? 'text-green-600' : 'text-slate-400'
                        }`}>
                          {req.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar - Send Request */}
      {canSendRequest && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-3 md:bottom-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Lời nhắn (tùy chọn)..."
              className="flex-1 h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleSendRequest}
              disabled={!canSubmit || isSubmitting}
              className={`h-10 px-4 rounded-lg font-bold text-sm flex items-center gap-1.5 transition-colors ${
                canSubmit 
                  ? 'bg-teal-500 text-white active:bg-teal-600' 
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Gửi
            </button>
          </div>
          {canSubmit && (
            <p className="text-[10px] text-teal-600 mt-1.5 text-center">
              Bạn muốn lấy thẻ của họ và đưa thẻ họ cần
            </p>
          )}
          {!canSubmit && (
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Chọn 1 thẻ bạn muốn và 1 thẻ bạn sẽ cho để gửi yêu cầu
            </p>
          )}
        </div>
      )}
    </div>
  );
}
