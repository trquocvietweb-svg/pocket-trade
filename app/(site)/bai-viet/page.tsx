'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Calendar, Eye, ChevronDown } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useLocale } from '@/app/contexts/LocaleContext';
import { Id } from '@/convex/_generated/dataModel';

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

export default function PostsListPage() {
  const { t } = useLocale();
  const categories = useQuery(api.postCategories.list, {});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Fetch posts based on selected category
  const allPublishedPosts = useQuery(api.posts.getPublished, {
    paginationOpts: { numItems: 100, cursor: null },
  });
  const categoryFilteredPosts = useQuery(
    api.postCategories.getPostsByCategory,
    selectedCategory ? { categoryId: selectedCategory as any } : "skip"
  );

  const posts = selectedCategory 
    ? (categoryFilteredPosts || [])
    : (allPublishedPosts?.page || []);
  
  const hasMore = !selectedCategory && !(allPublishedPosts?.isDone ?? true);
  const continueCursor = !selectedCategory ? (allPublishedPosts?.continueCursor ?? null) : null;
  
  const isLoading = selectedCategory 
    ? categoryFilteredPosts === undefined
    : allPublishedPosts === undefined;

  const filtered = useMemo(() => {
    if (!posts) return [];
    let filtered = posts;
    
    if (search) {
      filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
    }
    
    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        sorted.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'a-z':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
        break;
      case 'z-a':
        sorted.sort((a, b) => b.title.localeCompare(a.title, 'vi'));
        break;
    }
    
    return sorted;
  }, [posts, search, sortBy]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentCursor(null); // Reset pagination when changing category
  };

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'a-z', label: 'A - Z' },
    { value: 'z-a', label: 'Z - A' },
  ] as const;

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bài Viết</h1>
          
          {/* Categories Filter */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryChange(cat._id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat._id
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm bài viết..."
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:text-slate-200 transition-all"
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-teal-500 transition-all min-w-[140px]"
              >
                <Filter className="w-4 h-4" />
                <span>{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
              
              {showSortMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg z-20 overflow-hidden">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          sortBy === option.value
                            ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-medium'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200 dark:bg-slate-800" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {search ? 'Không tìm thấy bài viết' : 'Chưa có bài viết nào'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {search ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy quay lại sau để xem bài viết mới'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <Link
                  key={post._id}
                  href={`/bai-viet/${post.slug}`}
                  className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-teal-500 dark:hover:border-teal-500 transition-all duration-300"
                >
                  {post.imageUrl ? (
                    <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                      <Eye className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  
                  <div className="p-6 space-y-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && continueCursor && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setCurrentCursor(continueCursor)}
                  className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </>
        )}
      </div>
  );
}
