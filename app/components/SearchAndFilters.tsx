'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ListFilter, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { SortOption, SortDirection, FilterState, CardCategory } from '../types';
import { useLocale } from '../contexts/LocaleContext';

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  sortOption: SortOption;
  sortDirection: SortDirection;
  onSortChange: (val: SortOption) => void;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  resultCount: number;
  collections: string[];
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  sortOption,
  sortDirection,
  onSortChange,
  filters,
  setFilters,
  resultCount,
  collections
}) => {
  const { t } = useLocale();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setIsSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'ID', label: t.library.sortByCardNumber },
    { value: 'NAME', label: t.library.sortByName },
    { value: 'TYPE', label: t.library.sortByType },
  ];

  const categories: (CardCategory | 'All')[] = ['All', 'Pokemon', 'Trainer'];

  return (
    <div className="sticky top-0 md:top-16 z-40 bg-white border-b border-slate-200 pt-6 pb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative group flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
              <input 
                type="text"
                placeholder={t.library.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-600 transition-all placeholder:text-slate-500 tracking-wider"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative" ref={sortRef}>
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={`flex items-center gap-2 px-4 h-[42px] rounded-xl border transition-all text-[11px] font-bold whitespace-nowrap shadow-sm
                    ${isSortOpen ? 'border-teal-600 bg-teal-50 text-teal-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <span>{t.library.sort}</span>
                  <div className="w-[1px] h-3 bg-slate-300 mx-1" />
                  <span className="uppercase">{sortOptions.find(o => o.value === sortOption)?.label}</span>
                  {sortDirection === 'ASC' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          onSortChange(opt.value);
                          if (sortOption !== opt.value) setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors
                          ${sortOption === opt.value ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-50'}
                        `}
                      >
                        {opt.label}
                        {sortOption === opt.value && (
                          sortDirection === 'ASC' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 px-4 h-[42px] rounded-xl border transition-all text-[11px] font-bold shadow-sm whitespace-nowrap
                    ${isFilterOpen ? 'border-teal-600 bg-teal-50 text-teal-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  <ListFilter className="w-4 h-4" />
                  <span className="hidden md:inline">{t.library.filterDetail}</span>
                  <span className={`ml-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[9px] font-black transition-colors ${isFilterOpen ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {resultCount}
                  </span>
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 pb-3 mb-3 border-b border-slate-100">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.library.category}</h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setFilters({ ...filters, category: cat })}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all
                              ${filters.category === cat ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                            `}
                          >
                            {cat === 'All' ? t.common.all.toUpperCase() : cat.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-4 pb-3 mb-3 border-b border-slate-100 max-h-40 overflow-y-auto">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.library.packs}</h3>
                      <div className="grid grid-cols-1 gap-1">
                        <button
                          onClick={() => setFilters({ ...filters, collection: 'All' })}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold transition-all
                            ${filters.collection === 'All' ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-50'}
                          `}
                        >
                          {t.library.allPacks}
                          {filters.collection === 'All' && <Check className="w-3.5 h-3.5" />}
                        </button>
                        {collections.map((coll) => (
                          <button
                            key={coll}
                            onClick={() => setFilters({ ...filters, collection: coll })}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold transition-all
                              ${filters.collection === coll ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-50'}
                            `}
                          >
                            {coll.toUpperCase()}
                            {filters.collection === coll && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="px-4">
                      <button 
                        onClick={() => {
                          setFilters({ category: 'All', collection: 'All', type: 'All' });
                          setIsFilterOpen(false);
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all uppercase tracking-tighter"
                      >
                        {t.library.clearFilters}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilters;
