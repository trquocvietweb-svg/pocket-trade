/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, ArrowUpDown, Database } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

export default function RaritiesPage() {
  const rarities = useQuery(api.rarities.list, {});
  const removeRarity = useMutation(api.rarities.remove);
  const bulkRemoveRarities = useMutation(api.rarities.bulkRemove);
  const seedRarities = useMutation(api.rarities.seed);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"rarities">>>(new Set());

  const filteredAndSorted = useMemo(() => {
    if (!rarities) return [];
    const result = rarities.filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a, b) => {
      const aVal = a.name.toLowerCase();
      const bVal = b.name.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [rarities, search, sortDir]);

  const handleDelete = async (id: Id<"rarities">) => {
    if (confirm('Bạn có chắc muốn xóa độ hiếm này?')) {
      await removeRarity({ id });
    }
  };

  const toggleSelect = (id: Id<"rarities">) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map(r => r._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Xóa ${selectedIds.size} độ hiếm đã chọn?`)) {
      await bulkRemoveRarities({ ids: Array.from(selectedIds) });
      toast.success(`Đã xóa ${selectedIds.size} độ hiếm`);
      setSelectedIds(new Set());
    }
  };

  const handleSeed = async () => {
    if (confirm('Thao tác này sẽ xóa tất cả độ hiếm hiện có và thêm dữ liệu mẫu Pokemon TCG Pocket. Bạn có chắc chắn?')) {
      setIsSeeding(true);
      try {
        const result = await seedRarities();
        toast.success(`Đã thêm ${result.count} độ hiếm thành công!`);
      } catch (error) {
        toast.error('Có lỗi xảy ra khi seed dữ liệu');
        console.error(error);
      } finally {
        setIsSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Độ Hiếm</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý độ hiếm thẻ bài</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database size={20} className={isSeeding ? 'animate-spin' : ''} />
            <span>{isSeeding ? 'Đang seed...' : 'Seed Data'}</span>
          </button>
          <Link
            href="/admin/rarities/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Thêm Độ Hiếm</span>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm độ hiếm..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
            />
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
                    checked={filteredAndSorted.length > 0 && selectedIds.size === filteredAndSorted.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hình ảnh</th>
                <th 
                  onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <span className="inline-flex items-center gap-1">
                    Tên
                    <ArrowUpDown size={14} className="text-indigo-500" />
                  </span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!rarities ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    {search ? 'Không tìm thấy độ hiếm nào' : 'Chưa có độ hiếm nào'}
                  </td>
                </tr>
              ) : filteredAndSorted.map((rarity) => (
                <tr key={rarity._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rarity._id)}
                      onChange={() => toggleSelect(rarity._id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    {rarity.imageUrl ? (
                      <img src={rarity.imageUrl} alt={rarity.name} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                        IMG
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900 dark:text-white text-lg">{rarity.name}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link 
                        href={`/admin/rarities/${rarity._id}/edit`}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(rarity._id)}
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
            {rarities ? `Hiển thị ${filteredAndSorted.length}/${rarities.length} độ hiếm` : 'Đang tải...'}
          </p>
        </div>
      </div>
    </div>
  );
}
