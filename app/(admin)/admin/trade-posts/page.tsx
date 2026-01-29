'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

const statusConfig: Record<string, { label: string; color: string; order: number }> = {
  active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', order: 1 },
  matched: { label: 'Đã match', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', order: 2 },
  expired: { label: 'Hết hạn', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', order: 3 },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', order: 4 },
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type SortField = 'status' | 'traderName' | 'requestsCount' | null;
type SortOrder = 'asc' | 'desc';

export default function TradePostsPage() {
  const tradePosts = useQuery(api.tradePosts.list);
  const removePost = useMutation(api.tradePosts.remove);
  
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-400" />;
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="text-indigo-500" /> 
      : <ArrowDown size={14} className="text-indigo-500" />;
  };

  const sortedPosts = useMemo(() => {
    if (!tradePosts) return null;
    
    let filtered = tradePosts.filter(post => {
      if (searchQuery && !post.traderName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter && post.status !== statusFilter) return false;
      return true;
    });

    if (!sortField) return filtered;
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'status':
          comparison = (statusConfig[a.status]?.order || 99) - (statusConfig[b.status]?.order || 99);
          break;
        case 'traderName':
          comparison = a.traderName.localeCompare(b.traderName, 'vi');
          break;
        case 'requestsCount':
          comparison = a.requestsCount - b.requestsCount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tradePosts, sortField, sortOrder, searchQuery, statusFilter]);

  const handleDelete = async (id: Id<"tradePosts">) => {
    if (confirm('Bạn có chắc muốn xóa bài đăng này?')) {
      await removePost({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Trade Posts</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý các bài đăng trade</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo trader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="matched">Đã match</option>
            <option value="expired">Hết hạn</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th 
                  onClick={() => handleSort('traderName')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                >
                  <div className="flex items-center gap-1">
                    Trader
                    <SortIcon field="traderName" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Có (Have)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cần (Want)</th>
                <th 
                  onClick={() => handleSort('status')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                >
                  <div className="flex items-center gap-1">
                    Trạng thái
                    <SortIcon field="status" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('requestsCount')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                >
                  <div className="flex items-center gap-1">
                    Requests
                    <SortIcon field="requestsCount" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hết hạn</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!sortedPosts ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : sortedPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Chưa có bài đăng nào</td>
                </tr>
              ) : sortedPosts.map((post) => {
                const status = statusConfig[post.status] || statusConfig.active;
                const maxDisplay = 5;
                const haveExtra = post.haveCardsCount - maxDisplay;
                const wantExtra = post.wantCardsCount - maxDisplay;
                
                return (
                  <tr key={post._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {post.traderAvatar ? (
                          <img src={post.traderAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                            {post.traderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <p className="font-medium text-slate-900 dark:text-white">{post.traderName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {post.haveCards.slice(0, maxDisplay).map((card) => (
                          <img 
                            key={card._id} 
                            src={card.imageUrl} 
                            alt={card.name}
                            title={card.name}
                            className="w-10 h-14 object-cover rounded border border-green-300 dark:border-green-600"
                          />
                        ))}
                        {haveExtra > 0 && (
                          <div className="w-10 h-14 rounded border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400">
                            +{haveExtra}
                          </div>
                        )}
                        {post.haveCardsCount === 0 && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {post.wantCards.slice(0, maxDisplay).map((card) => (
                          <img 
                            key={card._id} 
                            src={card.imageUrl} 
                            alt={card.name}
                            title={card.name}
                            className="w-10 h-14 object-cover rounded border border-blue-300 dark:border-blue-600"
                          />
                        ))}
                        {wantExtra > 0 && (
                          <div className="w-10 h-14 rounded border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                            +{wantExtra}
                          </div>
                        )}
                        {post.wantCardsCount === 0 && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {post.isHidden && (
                        <span className="ml-1 text-xs text-amber-500">(Ẩn)</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">{post.requestsCount}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">{formatDate(post.expiresAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/admin/trade-posts/${post._id}`}
                          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(post._id)}
                          className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {sortedPosts ? `Hiển thị ${sortedPosts.length} bài đăng` : 'Đang tải...'}
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50" disabled>
              Trước
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50" disabled>
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
