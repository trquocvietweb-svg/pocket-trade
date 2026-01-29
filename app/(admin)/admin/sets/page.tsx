'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

type SortField = 'name' | 'setCode' | 'packCount' | 'cardCount' | 'order';
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100, 'all'] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

export default function SetsPage() {
  const sets = useQuery(api.sets.list, {});
  const seriesList = useQuery(api.series.list, {});
  const removeSet = useMutation(api.sets.remove);
  const bulkRemoveSets = useMutation(api.sets.bulkRemove);
  const reorderSets = useMutation(api.sets.reorder);
  const [search, setSearch] = useState('');
  const [filterSeries, setFilterSeries] = useState('');
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isReordering, setIsReordering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"sets">>>(new Set());

  const filteredAndSorted = useMemo(() => {
    if (!sets) return [];
    let result = sets.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.setCode.toLowerCase().includes(search.toLowerCase());
      const matchSeries = !filterSeries || s.seriesId === filterSeries;
      return matchSearch && matchSeries;
    });
    // Nếu sortField là order, giữ nguyên thứ tự từ server
    if (sortField === 'order') {
      return sortDir === 'asc' ? result : [...result].reverse();
    }
    result.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      if (sortField === 'name') { aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); }
      else if (sortField === 'setCode') { aVal = a.setCode.toLowerCase(); bVal = b.setCode.toLowerCase(); }
      else if (sortField === 'packCount') { aVal = a.packCount; bVal = b.packCount; }
      else { aVal = a.cardCount; bVal = b.cardCount; }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [sets, search, filterSeries, sortField, sortDir]);

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

  const handleFilterSeries = (value: string) => {
    setFilterSeries(value);
    setCurrentPage(1);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleDelete = async (id: Id<"sets">) => {
    if (confirm('Bạn có chắc muốn xóa set này?')) {
      await removeSet({ id });
    }
  };

  const toggleSelect = (id: Id<"sets">) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(s => s._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Xóa ${selectedIds.size} sets đã chọn?`)) {
      await bulkRemoveSets({ ids: Array.from(selectedIds) });
      toast.success(`Đã xóa ${selectedIds.size} sets`);
      setSelectedIds(new Set());
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !sets) return;
    setIsReordering(true);
    const newOrder = [...filteredAndSorted.map(s => s._id)];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await reorderSets({ orderedIds: newOrder });
    setIsReordering(false);
  };

  const handleMoveDown = async (index: number) => {
    if (!sets || index === filteredAndSorted.length - 1) return;
    setIsReordering(true);
    const newOrder = [...filteredAndSorted.map(s => s._id)];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await reorderSets({ orderedIds: newOrder });
    setIsReordering(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sets</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý bộ sưu tập thẻ</p>
        </div>
        <Link
          href="/admin/sets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Thêm Set</span>
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
              placeholder="Tìm kiếm set..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
            />
          </div>
          <select 
            value={filterSeries}
            onChange={(e) => handleFilterSeries(e.target.value)}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
          >
            <option value="">Tất cả Series</option>
            {seriesList?.map(s => (
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
                  <span className="inline-flex items-center gap-1">Set <ArrowUpDown size={14} className={sortField === 'name' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th onClick={() => toggleSort('setCode')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Mã <ArrowUpDown size={14} className={sortField === 'setCode' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Series</th>
                <th onClick={() => toggleSort('packCount')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Packs <ArrowUpDown size={14} className={sortField === 'packCount' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th onClick={() => toggleSort('cardCount')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Thẻ <ArrowUpDown size={14} className={sortField === 'cardCount' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!sets ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {search || filterSeries ? 'Không tìm thấy set nào' : 'Chưa có set nào'}
                  </td>
                </tr>
              ) : paginatedData.map((set, idx) => {
                const globalIndex = pageSize === 'all' ? idx : (currentPage - 1) * (pageSize as number) + idx;
                return (
                <tr key={set._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(set._id)}
                      onChange={() => toggleSelect(set._id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {set.imageUrl ? (
                        <img src={set.imageUrl} alt={set.name} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                          IMG
                        </div>
                      )}
                      <p className="font-medium text-slate-900 dark:text-white">{set.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {set.setCode}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{set.seriesName}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{set.packCount}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{set.cardCount}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => handleMoveUp(globalIndex)}
                        disabled={globalIndex === 0 || isReordering || sortField !== 'order'}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Di chuyển lên"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(globalIndex)}
                        disabled={globalIndex === filteredAndSorted.length - 1 || isReordering || sortField !== 'order'}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Di chuyển xuống"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <Link 
                        href={`/admin/sets/${set._id}/edit`}
                        className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(set._id)}
                        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
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
              / {totalItems} sets
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
