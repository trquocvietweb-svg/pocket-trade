'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

type SortField = 'name' | 'setCount';
type SortDir = 'asc' | 'desc';

export default function SeriesPage() {
  const seriesList = useQuery(api.series.list, {});
  const removeSeries = useMutation(api.series.remove);
  const bulkRemoveSeries = useMutation(api.series.bulkRemove);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<Id<"series">>>(new Set());

  const filteredAndSorted = useMemo(() => {
    if (!seriesList) return [];
    let result = seriesList.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    result.sort((a, b) => {
      const aVal = sortField === 'name' ? a.name.toLowerCase() : a.setCount;
      const bVal = sortField === 'name' ? b.name.toLowerCase() : b.setCount;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [seriesList, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id: Id<"series">) => {
    if (confirm('Bạn có chắc muốn xóa series này?')) {
      await removeSeries({ id });
    }
  };

  const toggleSelect = (id: Id<"series">) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map(s => s._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Xóa ${selectedIds.size} series đã chọn?`)) {
      await bulkRemoveSeries({ ids: Array.from(selectedIds) });
      toast.success(`Đã xóa ${selectedIds.size} series`);
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Series</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý series thẻ bài</p>
        </div>
        <Link
          href="/admin/series/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Thêm Series</span>
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
              placeholder="Tìm kiếm series..."
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
                <th 
                  onClick={() => toggleSort('name')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <span className="inline-flex items-center gap-1">
                    Series
                    <ArrowUpDown size={14} className={sortField === 'name' ? 'text-indigo-500' : ''} />
                  </span>
                </th>
                <th 
                  onClick={() => toggleSort('setCount')}
                  className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <span className="inline-flex items-center gap-1">
                    Số Sets
                    <ArrowUpDown size={14} className={sortField === 'setCount' ? 'text-indigo-500' : ''} />
                  </span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!seriesList ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    {search ? 'Không tìm thấy series nào' : 'Chưa có series nào'}
                  </td>
                </tr>
              ) : filteredAndSorted.map((series) => (
                <tr key={series._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(series._id)}
                      onChange={() => toggleSelect(series._id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900 dark:text-white">{series.name}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {series.setCount} sets
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link 
                        href={`/admin/series/${series._id}/edit`}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(series._id)}
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
            {seriesList ? `Hiển thị ${filteredAndSorted.length}/${seriesList.length} series` : 'Đang tải...'}
          </p>
        </div>
      </div>
    </div>
  );
}
