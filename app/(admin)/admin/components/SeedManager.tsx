'use client';

import React, { useState } from 'react';
import { Database, Trash2, RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

interface SetInfo {
  setCode: string;
  name: string;
  seriesName: string;
  cardCount: number;
  isSeeded: boolean;
}

const SeedManager: React.FC = () => {
  const sets = useQuery(api.seedData.getAvailableSets);
  const seedSet = useMutation(api.seedData.seedSet);
  const seedAll = useMutation(api.seedData.seedAll);
  const deleteSet = useMutation(api.seedData.deleteSet);
  const deleteAll = useMutation(api.seedData.deleteAll);

  const [loading, setLoading] = useState<string | null>(null);

  const handleSeedSet = async (setCode: string) => {
    setLoading(setCode);
    try {
      const result = await seedSet({ setCode });
      if (result.success) {
        toast.success(`Seed ${result.setName} thành công! ${result.cardCount} cards`);
      } else {
        toast.error(result.error || 'Lỗi seed');
      }
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleSeedAll = async () => {
    if (!confirm('Seed tất cả sets? Dữ liệu cũ sẽ bị xóa.')) return;
    
    setLoading('all');
    try {
      const result = await seedAll();
      if (result.success) {
        toast.success(`Seed hoàn tất! ${result.totalSets} sets, ${result.totalPacks} packs, ${result.totalCards} cards`);
      }
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteSet = async (setCode: string, setName: string) => {
    if (!confirm(`Xóa set ${setName}? Tất cả cards thuộc set này sẽ bị xóa.`)) return;
    
    setLoading(`delete-${setCode}`);
    try {
      const result = await deleteSet({ setCode });
      if (result.success) {
        toast.success(`Đã xóa ${setName}: ${result.deletedCards} cards`);
      } else {
        toast.error(result.error || 'Lỗi xóa');
      }
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Xóa TẤT CẢ dữ liệu? (Series, Sets, Packs, Cards)')) return;
    
    setLoading('deleteAll');
    try {
      const result = await deleteAll();
      if (result.success) {
        toast.success(`Đã xóa: ${result.deletedCards} cards, ${result.deletedPacks} packs, ${result.deletedSets} sets, ${result.deletedSeries} series`);
      }
    } catch (error) {
      toast.error('Lỗi: ' + (error as Error).message);
    } finally {
      setLoading(null);
    }
  };

  if (!sets) {
    return <div className="text-center py-8 text-slate-500">Đang tải...</div>;
  }

  const seededCount = sets.filter((s: SetInfo) => s.isSeeded).length;
  const totalCards = sets.reduce((acc: number, s: SetInfo) => acc + (s.isSeeded ? s.cardCount : 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quản lý Seed Data</h2>
          <p className="text-sm text-slate-500">
            {seededCount}/{sets.length} sets đã seed • ~{totalCards.toLocaleString()} cards
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDeleteAll}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            <XCircle size={18} />
            <span>{loading === 'deleteAll' ? 'Đang xóa...' : 'Xóa Tất Cả'}</span>
          </button>
          <button
            onClick={handleSeedAll}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
          >
            <Database size={18} />
            <span>{loading === 'all' ? 'Đang seed...' : 'Seed Tất Cả'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sets.map((set: SetInfo) => (
          <div
            key={set.setCode}
            className={`p-4 rounded-xl border ${
              set.isSeeded 
                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' 
                : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {set.isSeeded ? (
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-slate-400 flex-shrink-0" />
                  )}
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {set.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {set.setCode} • {set.seriesName} • {set.cardCount} cards
                </p>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleSeedSet(set.setCode)}
                  disabled={loading !== null}
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50"
                  title={set.isSeeded ? 'Re-seed' : 'Seed'}
                >
                  {loading === set.setCode ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </button>
                {set.isSeeded && (
                  <button
                    onClick={() => handleDeleteSet(set.setCode, set.name)}
                    disabled={loading !== null}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Xóa set"
                  >
                    {loading === `delete-${set.setCode}` ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeedManager;
