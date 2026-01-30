/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Settings2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

export default function PostsPage() {
  const posts = useQuery(api.posts.list);
  const removePost = useMutation(api.posts.remove);
  const bulkRemovePosts = useMutation(api.posts.bulkRemove);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'published' | 'draft'>('');
  const [selectedIds, setSelectedIds] = useState<Set<Id<"posts">>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    title: true,
    slug: false,
    createdAt: false,
    isPublished: true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const filtered = useMemo(() => {
    if (!posts) return [];
    return posts.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === '' || 
        (statusFilter === 'published' && p.isPublished) || 
        (statusFilter === 'draft' && !p.isPublished);
      return matchSearch && matchStatus;
    });
  }, [posts, search, statusFilter]);

  const handleDelete = async (id: Id<"posts">) => {
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
      await removePost({ id });
      toast.success('Đã xóa bài viết');
    }
  };

  const toggleSelect = (id: Id<"posts">) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Xóa ${selectedIds.size} bài viết đã chọn?`)) {
      await bulkRemovePosts({ ids: Array.from(selectedIds) });
      toast.success(`Đã xóa ${selectedIds.size} bài viết`);
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bài Viết</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý bài viết</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Thêm Bài viết</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | 'published' | 'draft')}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
          </select>
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              <Settings2 size={16} />
              <span>Cột</span>
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-10">
                {Object.entries(visibleColumns).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                      {key === 'image' ? 'Hình ảnh' : key === 'title' ? 'Tiêu đề' : key === 'slug' ? 'Slug' : key === 'createdAt' ? 'Ngày tạo' : 'Trạng thái'}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Trash2 size={16} />
              <span>Xóa {selectedIds.size} mục</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                {visibleColumns.image && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">Ảnh</th>
                )}
                {visibleColumns.title && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiêu đề</th>
                )}
                {visibleColumns.slug && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slug</th>
                )}
                {visibleColumns.createdAt && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                )}
                {visibleColumns.isPublished && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                )}
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!posts ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {search || statusFilter ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}
                  </td>
                </tr>
              ) : filtered.map((post) => (
                <tr key={post._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post._id)}
                      onChange={() => toggleSelect(post._id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  {visibleColumns.image && (
                    <td className="px-4 py-4">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt={post.title} className="h-10 w-16 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-16 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                          IMG
                        </div>
                      )}
                    </td>
                  )}
                  {visibleColumns.title && (
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">{post.title}</p>
                    </td>
                  )}
                  {visibleColumns.slug && (
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400 font-mono text-sm">{post.slug}</td>
                  )}
                  {visibleColumns.createdAt && (
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{formatDate(post.createdAt)}</td>
                  )}
                  {visibleColumns.isPublished && (
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        post.isPublished
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {post.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link 
                        href={`/admin/posts/${post._id}/edit`}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {posts ? `Hiển thị ${filtered.length}/${posts.length} bài viết` : 'Đang tải...'}
          </p>
        </div>
      </div>
    </div>
  );
}
