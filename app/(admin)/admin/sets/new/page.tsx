'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import ImageUpload from '@/app/components/ImageUpload';

export default function NewSetPage() {
  const router = useRouter();
  const seriesList = useQuery(api.series.list, {});
  const createSet = useMutation(api.sets.create);
  const markFileUsed = useMutation(api.files.markFileUsed);

  const [name, setName] = useState('');
  const [setCode, setSetCode] = useState('');
  const [seriesId, setSeriesId] = useState<Id<'series'> | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !setCode.trim() || !seriesId || !imageUrl.trim()) return;

    setIsLoading(true);
    try {
      const id = await createSet({
        name: name.trim(),
        setCode: setCode.trim(),
        seriesId: seriesId as Id<'series'>,
        imageUrl: imageUrl.trim(),
      });
      if (imageUrl.includes('convex.cloud')) {
        await markFileUsed({ url: imageUrl, usedBy: `sets:${id}` });
      }
      router.push('/admin/sets');
    } catch (error) {
      console.error('Failed to create set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/sets"
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thêm Set Mới</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tạo bộ sưu tập thẻ mới</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tên Set
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
                placeholder="VD: Genetic Apex"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mã Set
              </label>
              <input
                type="text"
                value={setCode}
                onChange={(e) => setSetCode(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
                placeholder="VD: A1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Series
              </label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value as Id<'series'>)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
                required
              >
                <option value="">Chọn Series</option>
                {seriesList?.map((series) => (
                  <option key={series._id} value={series._id}>
                    {series.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Hình ảnh
            </label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/admin/sets"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isLoading || !imageUrl}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang tạo...' : 'Tạo Set'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
