'use client';

import React, { useState, useEffect } from 'react';
import { Save, Globe, ImageIcon, Search, Settings as SettingsIcon, Loader2, X, Plus } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import ImageUpload from '@/app/components/ImageUpload';

export default function SettingsPage() {
  const settings = useQuery(api.settings.get);
  const upsertSettings = useMutation(api.settings.upsert);
  
  const [form, setForm] = useState({
    siteName: '',
    logo: '',
    favicon: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
    contactEmail: '',
    contactPhone: '',
    limitTradePostPerTrader: 5,
    limitCardPerPost: 10,
    tradePostDurationHours: 48,
    limitRequestPerTraderPerDay: 20,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings.siteName || '',
        logo: settings.logo || '',
        favicon: settings.favicon || '',
        seoTitle: settings.seoTitle || '',
        seoDescription: settings.seoDescription || '',
        seoKeywords: settings.seoKeywords || [],
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        limitTradePostPerTrader: settings.limitTradePostPerTrader,
        limitCardPerPost: settings.limitCardPerPost,
        tradePostDurationHours: settings.tradePostDurationHours,
        limitRequestPerTraderPerDay: settings.limitRequestPerTraderPerDay ?? 20,
      });
    }
  }, [settings]);

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !form.seoKeywords.includes(keyword)) {
      setForm({ ...form, seoKeywords: [...form.seoKeywords, keyword] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setForm({ ...form, seoKeywords: form.seoKeywords.filter(k => k !== keyword) });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSave = async () => {
    if (!form.siteName.trim()) {
      toast.error('Tên website không được để trống');
      return;
    }
    
    setIsSaving(true);
    try {
      await upsertSettings({
        siteName: form.siteName,
        logo: form.logo || undefined,
        favicon: form.favicon || undefined,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        seoKeywords: form.seoKeywords.length > 0 ? form.seoKeywords : undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        limitTradePostPerTrader: form.limitTradePostPerTrader,
        limitCardPerPost: form.limitCardPerPost,
        tradePostDurationHours: form.tradePostDurationHours,
        limitRequestPerTraderPerDay: form.limitRequestPerTraderPerDay || undefined,
      });
      toast.success('Đã lưu cài đặt');
    } catch {
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setIsSaving(false);
    }
  };

  if (settings === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý cài đặt website</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Lưu thay đổi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Globe size={20} className="text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Thông tin chung</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tên website *
              </label>
              <input
                type="text"
                value={form.siteName}
                onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email liên hệ
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <ImageIcon size={20} className="text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hình ảnh</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Logo
              </label>
              <ImageUpload
                value={form.logo}
                onChange={(url) => setForm({ ...form, logo: url })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Favicon
              </label>
              <ImageUpload
                value={form.favicon}
                onChange={(url) => setForm({ ...form, favicon: url })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Search size={20} className="text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">SEO</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                SEO Title
              </label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                placeholder="Pocket Trade - Trao đổi thẻ Pokemon TCG Pocket"
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                SEO Description
              </label>
              <textarea
                rows={3}
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                placeholder="Mô tả ngắn gọn về website..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Từ khóa SEO
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  placeholder="Nhập từ khóa và nhấn Enter..."
                  className="flex-1 h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-3 h-10 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              {form.seoKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.seoKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Các từ khóa giúp website dễ tìm kiếm hơn trên Google
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <SettingsIcon size={20} className="text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Giới hạn Trade</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Số bài đăng tối đa / trader
              </label>
              <input
                type="number"
                value={form.limitTradePostPerTrader}
                onChange={(e) => setForm({ ...form, limitTradePostPerTrader: Number(e.target.value) || 5 })}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Giới hạn số bài trade mỗi trader có thể đăng cùng lúc</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Số thẻ tối đa / bài đăng
              </label>
              <input
                type="number"
                value={form.limitCardPerPost}
                onChange={(e) => setForm({ ...form, limitCardPerPost: Number(e.target.value) || 10 })}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Giới hạn số thẻ (have + want) trong mỗi bài đăng</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Thời hạn bài đăng (giờ)
              </label>
              <input
                type="number"
                value={form.tradePostDurationHours}
                onChange={(e) => setForm({ ...form, tradePostDurationHours: Number(e.target.value) || 48 })}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bài đăng sẽ tự động hết hạn sau số giờ này</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Số request tối đa / trader / ngày
              </label>
              <input
                type="number"
                value={form.limitRequestPerTraderPerDay}
                onChange={(e) => setForm({ ...form, limitRequestPerTraderPerDay: Number(e.target.value) || 20 })}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Giới hạn số request trade mỗi trader có thể gửi trong ngày (mặc định: 20)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
