'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTraderAuth } from '../contexts/TraderAuthContext';
import { Id } from '@/convex/_generated/dataModel';
import {
  ChevronLeft, AlertTriangle, Copy, RefreshCcw, Image as ImageIcon,
  Send, Loader2, Check, X, CheckCheck, XCircle, CheckCircle2, Clock
} from 'lucide-react';
import { toast } from 'sonner';

// Tính rank từ tradePoint
const getRank = (tradePoint: number) => {
  if (tradePoint > 1000) return { name: 'Kim Cương', color: 'text-cyan-500', bg: 'bg-cyan-50' };
  if (tradePoint > 500) return { name: 'Vàng', color: 'text-yellow-500', bg: 'bg-yellow-50' };
  if (tradePoint > 200) return { name: 'Bạc', color: 'text-slate-400', bg: 'bg-slate-100' };
  if (tradePoint >= 100) return { name: 'Đồng', color: 'text-orange-500', bg: 'bg-orange-50' };
  return { name: 'Sắt', color: 'text-slate-500', bg: 'bg-slate-100' };
};

// Format time
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

interface ChatDetailProps {
  chatId: string;
  onBack: () => void;
}

const ChatDetail: React.FC<ChatDetailProps> = ({ chatId, onBack }) => {
  const { trader } = useTraderAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chat = useQuery(api.chats.getById, { chatId: chatId as Id<"chats"> });
  const messages = useQuery(api.messages.listByChat, { chatId: chatId as Id<"chats"> });

  const sendMessage = useMutation(api.messages.send);
  const markAsRead = useMutation(api.messages.markAsRead);
  const confirmTrade = useMutation(api.chats.confirmTrade);
  const unconfirmTrade = useMutation(api.chats.unconfirmTrade);
  const cancelTrade = useMutation(api.chats.cancelTrade);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read
  useEffect(() => {
    if (trader && chat) {
      markAsRead({ chatId: chatId as Id<"chats">, traderId: trader._id });
    }
  }, [trader, chat, chatId, messages]);

  const handleSend = async () => {
    if (!message.trim() || !trader || sending) return;
    setSending(true);
    try {
      await sendMessage({
        chatId: chatId as Id<"chats">,
        senderId: trader._id,
        content: message.trim(),
        contentType: 'text',
      });
      setMessage('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !trader) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Hình ảnh không được vượt quá 5MB');
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload-chat-image', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload thất bại');
      const { url } = await response.json();
      await sendMessage({
        chatId: chatId as Id<"chats">,
        senderId: trader._id,
        content: url,
        contentType: 'image',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload hình ảnh thất bại');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!trader) return;
    try {
      const result = await confirmTrade({ chatId: chatId as Id<"chats">, traderId: trader._id });
      if (result.completed) {
        toast.success('🎉 Giao dịch hoàn thành! +1 Trade Point cho cả hai!');
      } else {
        toast.success('✓ Đã xác nhận! Chờ đối phương xác nhận...');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi');
    }
  };

  const handleUnconfirm = async () => {
    if (!trader) return;
    try {
      await unconfirmTrade({ chatId: chatId as Id<"chats">, traderId: trader._id });
      toast.info('Đã hủy xác nhận');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi');
    }
  };

  const handleCancel = async () => {
    if (!trader) return;
    try {
      await cancelTrade({ chatId: chatId as Id<"chats">, traderId: trader._id });
      toast.info('Đã hủy giao dịch');
      setShowCancelModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi');
    }
  };

  const copyFriendCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã copy Friend Code');
  };

  if (!chat || !trader) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  const partner = chat.traderHostId === trader._id ? chat.guest : chat.host;
  const isHost = chat.traderHostId === trader._id;
  const partnerRank = getRank(partner?.tradePoint ?? 0);
  
  // Trạng thái xác nhận
  const myConfirmed = isHost ? chat.hostConfirmed : chat.guestConfirmed;
  const partnerConfirmed = isHost ? chat.guestConfirmed : chat.hostConfirmed;
  const cancelledByMe = chat.cancelledBy === trader._id;
  const cancelledByPartner = chat.cancelledBy && chat.cancelledBy !== trader._id;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-slate-50 rounded-full transition-colors">
            <ChevronLeft className="w-7 h-7 text-slate-800 stroke-[2.5px]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
              {partner?.avatarUrl ? (
                <img src={partner.avatarUrl} alt={partner.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-500">
                  {partner?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${partner?.isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-800 tracking-tight">{partner?.name}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${partnerRank.bg} ${partnerRank.color}`}>
                  {partnerRank.name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                {partner?.isOnline ? 'Đang online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-[#334155] px-4 py-2.5 flex items-start gap-2 text-[11px] leading-tight">
        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
        <p className="text-white font-bold tracking-tight">
          Hãy cẩn trọng với các trao đổi không công bằng. Không mở các liên kết hoặc mã lạ.
        </p>
      </div>

      {/* Friend Codes Section */}
      <div className="bg-white mx-3 mt-3 rounded-xl p-4 border border-slate-100 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 mb-3">FRIEND CODE ĐỂ KẾT BẠN</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] text-slate-400 mb-1">Bạn</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-bold text-slate-700">
                {trader.friendCode || 'Chưa có'}
              </span>
              {trader.friendCode && (
                <button onClick={() => copyFriendCode(trader.friendCode!)} className="p-1 hover:bg-slate-200 rounded">
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>
          <div className="bg-teal-50 rounded-lg p-3">
            <p className="text-[10px] text-teal-600 mb-1">{partner?.name}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-bold text-teal-700">
                {partner?.friendCode || 'Chưa có'}
              </span>
              {partner?.friendCode && (
                <button onClick={() => copyFriendCode(partner.friendCode!)} className="p-1 hover:bg-teal-100 rounded">
                  <Copy className="w-3.5 h-3.5 text-teal-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Status & Actions */}
      <div className="bg-white mx-3 mt-3 rounded-xl p-4 border border-slate-100 shadow-sm">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${
            chat.status === 'completed' ? 'bg-green-100 text-green-600' :
            chat.status === 'cancelled' ? 'bg-red-100 text-red-500' :
            'bg-amber-100 text-amber-600'
          }`}>
            {chat.status === 'completed' ? '✓ GIAO DỊCH HOÀN THÀNH' :
             chat.status === 'cancelled' ? '✕ ĐÃ HỦY' : '⏳ ĐANG GIAO DỊCH'}
          </span>
        </div>

        {/* Trade Preview */}
        <div className="flex justify-around items-center py-3 bg-slate-50 rounded-xl mb-4">
          <div className="flex flex-col items-center gap-1.5">
            {chat.tradePreview.requestedCard && (
              <>
                <div className="relative w-14 aspect-[3/4] rounded-lg overflow-hidden shadow-md border border-slate-200 bg-white">
                  <img src={chat.tradePreview.requestedCard.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-black text-orange-500 uppercase">
                  {isHost ? 'Bạn gửi' : 'Bạn nhận'}
                </span>
              </>
            )}
          </div>
          <RefreshCcw className="w-4 h-4 text-slate-300" />
          <div className="flex flex-col items-center gap-1.5">
            {chat.tradePreview.offeredCard && (
              <>
                <div className="relative w-14 aspect-[3/4] rounded-lg overflow-hidden shadow-md border border-slate-200 bg-white">
                  <img src={chat.tradePreview.offeredCard.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-black text-teal-500 uppercase">
                  {isHost ? 'Bạn nhận' : 'Bạn gửi'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Confirmation Status - Only for active trades */}
        {chat.status === 'active' && (
          <>
            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className={`p-3 rounded-lg border-2 ${myConfirmed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {myConfirmed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-[11px] font-bold text-slate-600">Bạn</span>
                </div>
                <p className={`text-[10px] font-medium ${myConfirmed ? 'text-green-600' : 'text-slate-400'}`}>
                  {myConfirmed ? 'Đã xác nhận ✓' : 'Chưa xác nhận'}
                </p>
              </div>
              <div className={`p-3 rounded-lg border-2 ${partnerConfirmed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {partnerConfirmed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-[11px] font-bold text-slate-600">{partner?.name}</span>
                </div>
                <p className={`text-[10px] font-medium ${partnerConfirmed ? 'text-green-600' : 'text-slate-400'}`}>
                  {partnerConfirmed ? 'Đã xác nhận ✓' : 'Chưa xác nhận'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {!myConfirmed ? (
                <button
                  onClick={handleConfirm}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Xác nhận đã giao dịch xong
                </button>
              ) : (
                <button
                  onClick={handleUnconfirm}
                  className="w-full py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <X className="w-4 h-4" />
                  Hủy xác nhận
                </button>
              )}
              
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-2.5 bg-white border-2 border-red-200 text-red-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 active:scale-[0.98] transition-all"
              >
                <XCircle className="w-4 h-4" />
                Hủy giao dịch
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-3">
              💡 Giao dịch hoàn thành khi cả hai bên đều xác nhận
            </p>
          </>
        )}

        {/* Cancelled message */}
        {chat.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-600 mb-1">Giao dịch đã bị hủy</p>
            <p className="text-xs text-red-400">
              {cancelledByMe ? 'Bạn đã hủy giao dịch này' : `${partner?.name} đã hủy giao dịch`}
            </p>
          </div>
        )}

        {/* Completed message */}
        {chat.status === 'completed' && (
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-green-600 mb-1">Giao dịch thành công!</p>
            <p className="text-xs text-green-500">+1 Trade Point cho cả hai bên 🎉</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 pb-32">
        {messages?.map((msg) => {
          const isMe = msg.senderId === trader._id;
          return (
            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${isMe ? 'order-2' : 'order-1'}`}>
                {!isMe && (
                  <span className="text-[10px] text-slate-400 ml-1 mb-1 block">{msg.senderName}</span>
                )}
                <div className={`rounded-2xl p-3 ${
                  isMe
                    ? 'bg-teal-500 text-white rounded-br-none'
                    : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                }`}>
                  {msg.contentType === 'image' ? (
                    <img
                      src={msg.content}
                      alt="Chat image"
                      className="max-w-full rounded-lg cursor-pointer"
                      onClick={() => window.open(msg.content, '_blank')}
                    />
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[10px] text-slate-400">{formatTime(msg._creationTime)}</span>
                  {isMe && (
                    <CheckCheck className={`w-3 h-3 ${msg.isRead ? 'text-teal-500' : 'text-slate-300'}`} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {chat.status === 'active' ? (
        <div className="bg-white border-t border-slate-100 fixed bottom-0 left-0 right-0 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-[60]">
          <div className="flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {uploadingImage ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : <ImageIcon className="w-5 h-5 text-slate-400" />}
            </button>
            <div className="flex-grow relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Nhập tin nhắn..."
                className="w-full bg-slate-100/50 border border-slate-100 rounded-2xl py-3 px-4 pr-12 text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-500 rounded-xl text-white disabled:opacity-50 disabled:bg-slate-200"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border-t border-slate-200 fixed bottom-0 left-0 right-0 p-4 text-center z-[60]">
          <p className="text-sm text-slate-500">
            {chat.status === 'completed' ? 'Giao dịch đã hoàn thành' : 'Giao dịch đã bị hủy'}
          </p>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hủy giao dịch?</h3>
              <p className="text-sm text-slate-500">
                Bạn có chắc muốn hủy giao dịch này? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleCancel}
                className="w-full py-3 bg-red-500 text-white font-bold text-sm rounded-xl active:scale-[0.98] transition-all"
              >
                Xác nhận hủy
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl active:scale-[0.98] transition-all"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDetail;
