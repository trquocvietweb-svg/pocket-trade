'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import ImageUpload from '@/app/components/ImageUpload';

export default function NewCardPage() {
  const router = useRouter();
  const raritiesList = useQuery(api.rarities.list, {});
  const packsList = useQuery(api.packs.list, {});
  const createCard = useMutation(api.cards.create);
  const markFileUsed = useMutation(api.files.markFileUsed);

  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [rarityId, setRarityId] = useState<Id<'rarities'> | ''>('');
  const [supertype, setSupertype] = useState('');
  const [subtype, setSubtype] = useState('');
  const [type, setType] = useState('');
  const [packId, setPackId] = useState<Id<'packs'> | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cardNumber.trim() || !rarityId || !supertype || !subtype || !packId || !imageUrl.trim()) return;

    setIsLoading(true);
    try {
      const id = await createCard({
        name: name.trim(),
        cardNumber: cardNumber.trim(),
        rarityId: rarityId as Id<'rarities'>,
        supertype,
        subtype,
        type,
        packId: packId as Id<'packs'>,
        imageUrl: imageUrl.trim(),
      });
      if (imageUrl.includes('convex.cloud')) {
        await markFileUsed({ url: imageUrl, usedBy: `cards:${id}` });
      }
      router.push('/admin/cards');
    } catch (error) {
      console.error('Failed to create card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/cards"
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thêm Thẻ Mới</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tạo thẻ Pokemon TCG Pocket mới</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tên thẻ
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
                placeholder="VD: Pikachu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Số thẻ
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
                placeholder="VD: 001/100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Độ hiếm
              </label>
              <select
                value={rarityId}
                onChange={(e) => setRarityId(e.target.value as Id<'rarities'>)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
                required
              >
                <option value="">Chọn độ hiếm</option>
                {raritiesList?.map((rarity) => (
                  <option key={rarity._id} value={rarity._id}>
                    {rarity.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Supertype
              </label>
              <select
                value={supertype}
                onChange={(e) => setSupertype(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
                required
              >
                <option value="">Chọn supertype</option>
                <option value="pokemon">Pokemon</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Subtype
              </label>
              <select
                value={subtype}
                onChange={(e) => setSubtype(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
                required
              >
                <option value="">Chọn subtype</option>
                <option value="Basic">Basic</option>
                <option value="Stage 1">Stage 1</option>
                <option value="Stage 2">Stage 2</option>
                <option value="ex">ex</option>
                <option value="Item">Item</option>
                <option value="Supporter">Supporter</option>
                <option value="Tool">Tool</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Type <span className="text-slate-400 font-normal">(bỏ trống nếu Trainer)</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
              >
                <option value="">Không có</option>
                <option value="Grass">Grass</option>
                <option value="Fire">Fire</option>
                <option value="Water">Water</option>
                <option value="Lightning">Lightning</option>
                <option value="Psychic">Psychic</option>
                <option value="Fighting">Fighting</option>
                <option value="Darkness">Darkness</option>
                <option value="Metal">Metal</option>
                <option value="Dragon">Dragon</option>
                <option value="Colorless">Colorless</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pack
              </label>
              <select
                value={packId}
                onChange={(e) => setPackId(e.target.value as Id<'packs'>)}
                className="w-full h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 dark:text-slate-200"
                required
              >
                <option value="">Chọn pack</option>
                {packsList?.map((pack) => (
                  <option key={pack._id} value={pack._id}>
                    {pack.name}
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
              href="/admin/cards"
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isLoading || !imageUrl}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang tạo...' : 'Tạo thẻ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
