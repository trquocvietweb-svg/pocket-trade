'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

export default function EditCategoryPage() {
  const params = useParams();
  const id = params.id as Id<"postCategories">;
  const category = useQuery(api.postCategories.getById, { id });
  const categoryPosts = useQuery(api.postCategories.getPostsInCategory, { categoryId: id });
  const updateCategory = useMutation(api.postCategories.update);
  const removePostFromCategory = useMutation(api.postCategories.removePostFromCategory);
  
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Vui lòng điền tên danh mục');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCategory({ id, name });
      toast.success('Cập nhật danh mục thành công');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePost = async (postId: Id<"posts">) => {
    if (confirm('Gỡ bài viết khỏi danh mục này?')) {
      await removePostFromCategory({ postId, categoryId: id });
      toast.success('Đã gỡ bài viết');
    }
  };

  if (!category) {
    return <div className="text-center py-8 text-slate-500">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/categories"
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chỉnh Sửa Danh Mục</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Cập nhật thông tin danh mục</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tên danh mục *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
            </button>
            <Link
              href="/admin/categories"
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>

      {/* Posts in this category */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Bài viết trong danh mục ({categoryPosts?.length || 0})
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Thêm bài viết vào danh mục từ trang chỉnh sửa bài viết
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {!categoryPosts ? (
            <div className="px-6 py-8 text-center text-slate-500">Đang tải...</div>
          ) : categoryPosts.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              Chưa có bài viết nào trong danh mục này
            </div>
          ) : categoryPosts.map((post) => (
            <div key={post._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/admin/posts/${post._id}/edit`}
                  className="text-sm font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {post.title}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    post.isPublished 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {post.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRemovePost(post._id)}
                className="ml-4 p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Gỡ khỏi danh mục"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
