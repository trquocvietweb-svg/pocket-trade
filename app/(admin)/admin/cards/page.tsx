/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

type CardId = Id<"cards">;

const rarityColors: Record<string, string> = {
  '◆': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  '◆◆': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  '◆◆◆': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  '◆◆◆◆': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  '★': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  '★★': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  '★★★': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const TYPES = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless'];

type SortField = 'name' | 'rarityName' | 'type' | 'cardNumber';
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 'all'] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

export default function CardsPage() {
  const cards = useQuery(api.cards.list);
  const removeCard = useMutation(api.cards.remove);
  const bulkRemoveCards = useMutation(api.cards.bulkRemove);
  const [search, setSearch] = useState('');
  const [filterSupertype, setFilterSupertype] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [selectedIds, setSelectedIds] = useState<Set<CardId>>(new Set());

  // Lấy danh sách sets unique từ cards
  const sets = useMemo(() => {
    if (!cards) return [];
    const setNames = [...new Set(cards.map(c => c.setName).filter(Boolean))];
    return setNames.sort();
  }, [cards]);

  const filteredAndSorted = useMemo(() => {
    if (!cards) return [];
    const result = cards.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.cardNumber.toLowerCase().includes(search.toLowerCase());
      const matchSupertype = !filterSupertype || c.supertype === filterSupertype;
      const matchType = !filterType || (filterType === '__empty__' ? !c.type : c.type === filterType);
      const matchSet = !filterSet || c.setName === filterSet;
      return matchSearch && matchSupertype && matchType && matchSet;
    });
    result.sort((a, b) => {
      const aVal = a[sortField]?.toLowerCase() || '';
      const bVal = b[sortField]?.toLowerCase() || '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [cards, search, filterSupertype, filterType, filterSet, sortField, sortDir]);

  const totalItems = filteredAndSorted.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);
  const paginatedData = useMemo(() => {
    if (pageSize === 'all') return filteredAndSorted;
    const start = (currentPage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, currentPage, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleDelete = async (id: CardId) => {
    if (confirm('Bạn có chắc muốn xóa thẻ này?')) {
      await removeCard({ id });
    }
  };

  const toggleSelect = (id: CardId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(c => c._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Xóa ${selectedIds.size} thẻ đã chọn?`)) {
      await bulkRemoveCards({ ids: Array.from(selectedIds) });
      toast.success(`Đã xóa ${selectedIds.size} thẻ`);
      setSelectedIds(new Set());
    }
  };

  const handlePageSizeChange = (newSize: PageSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thẻ Bài</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý thẻ Pokemon TCG Pocket</p>
        </div>
        <Link
          href="/admin/cards/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Thêm thẻ</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm kiếm thẻ..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
            />
          </div>
          <select 
            value={filterSupertype}
            onChange={(e) => { setFilterSupertype(e.target.value); setCurrentPage(1); }}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
          >
            <option value="">Tất cả loại</option>
            <option value="pokemon">Pokemon</option>
            <option value="trainer">Trainer</option>
          </select>
          <select 
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
          >
            <option value="">Tất cả type</option>
            <option value="__empty__">Không có</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            value={filterSet}
            onChange={(e) => { setFilterSet(e.target.value); setCurrentPage(1); }}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
          >
            <option value="">Tất cả set</option>
            {sets.map(s => <option key={s} value={s}>{s}</option>)}
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
                  <span className="inline-flex items-center gap-1">Thẻ <ArrowUpDown size={14} className={sortField === 'name' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th onClick={() => toggleSort('rarityName')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Độ hiếm <ArrowUpDown size={14} className={sortField === 'rarityName' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Loại</th>
                <th onClick={() => toggleSort('type')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Type <ArrowUpDown size={14} className={sortField === 'type' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th onClick={() => toggleSort('cardNumber')} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                  <span className="inline-flex items-center gap-1">Số thẻ <ArrowUpDown size={14} className={sortField === 'cardNumber' ? 'text-indigo-500' : ''} /></span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Set</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!cards ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {search || filterSupertype || filterType || filterSet ? 'Không tìm thấy thẻ nào' : 'Chưa có thẻ nào'}
                  </td>
                </tr>
              ) : paginatedData.map((card) => (
                <tr key={card._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(card._id)}
                      onChange={() => toggleSelect(card._id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {card.imageUrl ? (
                        <img src={card.imageUrl} alt={card.name} className="h-12 w-9 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-9 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                          IMG
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{card.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{card.subtype}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${rarityColors[card.rarityName] || 'bg-slate-100 text-slate-700'}`}>
                      {card.rarityName}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400 capitalize">{card.supertype}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{card.type}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400 font-mono text-sm">
                    {card.setCode ? `${card.setCode}-${card.cardNumber}` : card.cardNumber}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-400 text-sm">{card.setName}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link 
                        href={`/admin/cards/${card._id}/edit`}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(card._id)}
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
              / {totalItems} thẻ
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
