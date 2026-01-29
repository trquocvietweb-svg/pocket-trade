'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import ImageUpload from '@/app/components/ImageUpload';

export default function EditRarityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as Id<'rarities'>;
  
  const rarity = useQuery(api.rarities.getById, { id });
  const updateRarity = useMutation(api.rarities.update);
  const markFileUsed = useMutation(api.files.markFileUsed);
  const deleteFile = useMutation(api.files.deleteFile);
  
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const originalImageUrl = useRef('');

  useEffect(() => {
    if (rarity) {
      setName(rarity.name);
      setImageUrl(rarity.imageUrl);
      originalImageUrl.current = rarity.imageUrl;
    }
  }, [rarity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim()) return;

    setIsLoading(true);
    try {
      await updateRarity({ id, name: name.trim(), imageUrl: imageUrl.trim() });
      
      if (imageUrl !== originalImageUrl.current) {
        if (originalImageUrl.current.includes('convex.cloud')) {
          await deleteFile({ url: originalImageUrl.current });
        }
        if (imageUrl.includes('convex.cloud')) {
          await markFileUsed({ url: imageUrl, usedBy: `rarities:${id}` });
        }
      }
      
      router.push('/admin/rarities');
    } catch (error) {
      console.error('Failed to update rarity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!rarity) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/rarities"
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chỉnh Sửa Độ Hiếm</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Cập nhật thông tin độ hiếm</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tên Độ Hiếm
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
              placeholder="VD: ◆◆◆"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Hình ảnh
            </label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/admin/rarities"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isLoading || !imageUrl}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang cập nhật...' : 'Cập Nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
