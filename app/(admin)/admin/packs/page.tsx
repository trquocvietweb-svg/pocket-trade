/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

type SortField = 'name' | 'setName' | 'cardCount';
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, 'all'] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

export default function PacksPage() {
  const packs = useQuery(api.packs.list, {});
  const sets = useQuery(api.sets.list, {});
  const removePack = useMutation(api.packs.remove);
  const bulkRemovePacks = useMutation(api.packs.bulkRemove);
  const [search, setSearch] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"packs">>>(new Set());

  const filteredAndSorted = useMemo(() => {
    if (!packs) return [];
    const result = packs.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchSet = !filterSet || p.setId === filterSet;
      return matchSearch && matchSet;
    });
    result.sort((a, b) => {
      const [aVal, bVal] = (() => {
        if (sortField === 'name') return [a.name.toLowerCase(), b.name.toLowerCase()];
        if (sortField === 'setName') return [a.setName.toLowerCase(), b.setName.toLowerCase()];
        return [a.cardCount, b.cardCount];
      })();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [packs, search, filterSet, sortField, sortDir]);

  const totalItems = filteredAndSorted.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);
  const paginatedData = useMemo(() => {
    if (pageSize === 'all') return filteredAndSorted;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  const handlePageSizeChange = (newSize: PageSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterSet = (value: string) => {
    setFilterSet(value);
    setCurrentPage(1);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleDelete = async (id: Id<"packs">) => {
    if (confirm('Bạn có chắc muốn xóa pack này?')) {
      await removePack({ id });
    }
  };

  const toggleSelect = (id: Id<"packs">) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(p => p._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Xóa ${selectedIds.size} packs đã chọn?`)) {
      await bulkRemovePacks({ ids: Array.from(selectedIds) });
      toast.success(`Đã xóa ${selectedIds.size} packs`);
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Packs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý các gói thẻ</p>
        </div>
        <Link
          href="/admin/packs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Thêm Pack</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm pack..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
            />
          </div>
          <select 
            value={filterSet}
            onChange={(e) => handleFilterSet(e.target.value)}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
          >
            <option value="">Tất cả Set</option>
            {sets?.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
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
                    checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th onClick={() => toggleSort('name')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Pack <ArrowUpDown size={14} className={sortField === 'name' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th onClick={() => toggleSort('setName')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Set <ArrowUpDown size={14} className={sortField === 'setName' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th onClick={() => toggleSort('cardCount')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Số thẻ <ArrowUpDown size={14} className={sortField === 'cardCount' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!packs ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {search || filterSet ? 'Không tìm thấy pack nào' : 'Chưa có pack nào'}
                  </td>
                </tr>
              ) : paginatedData.map((pack) => (
                <tr key={pack._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(pack._id)}
                      onChange={() => toggleSelect(pack._id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {pack.imageUrl ? (
                        <img src={pack.imageUrl} alt={pack.name} className="h-12 w-auto rounded object-contain" />
                      ) : (
                        <div className="h-12 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                          IMG
                        </div>
                      )}
                      <p className="font-medium text-slate-900 dark:text-white">{pack.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{pack.setName}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{pack.cardCount}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link 
                        href={`/admin/packs/${pack._id}/edit`}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(pack._id)}
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

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value) as PageSize)}
              className="h-8 px-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'Tất cả' : option}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              / {totalItems} packs
            </span>
          </div>
          
          {pageSize !== 'all' && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-200"
              >
                Đầu
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-200"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-200"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-200"
              >
                Cuối
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
