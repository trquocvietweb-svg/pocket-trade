'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, ShieldCheck, Crown, Loader2 } from 'lucide-react';
import { useAdminSession } from '../hooks/useAdminSession';

export default function AdminsPage() {
  const { admin: currentAdmin } = useAdminSession();
  const admins = useQuery(api.admins.list, {
    paginationOpts: { numItems: 100, cursor: null }
  });
  const removeAdmin = useMutation(api.admins.remove);
  
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const adminsList = admins?.page || [];
  const filteredAdmins = adminsList?.filter(
    (admin) =>
      admin.username.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: Id<'admins'>) => {
    if (!currentAdmin?.id || !currentAdmin.isSuperAdmin) return;
    if (!confirm('Bạn có chắc muốn xóa admin này?')) return;

    setDeleting(id);
    try {
      await removeAdmin({ 
        id, 
        currentAdminId: currentAdmin.id as Id<'admins'> 
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi xóa admin');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản Trị Viên</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý tài khoản admin</p>
        </div>
        {currentAdmin?.isSuperAdmin && (
          <Link
            href="/admin/admins/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Thêm Admin</span>
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vai trò</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {!admins ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredAdmins?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy admin nào
                  </td>
                </tr>
              ) : (
                filteredAdmins?.map((admin) => (
                  <tr key={admin._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          admin.isSuperAdmin 
                            ? 'bg-amber-100 dark:bg-amber-900/50' 
                            : 'bg-red-100 dark:bg-red-900/50'
                        }`}>
                          {admin.isSuperAdmin ? (
                            <Crown size={20} className="text-amber-600 dark:text-amber-400" />
                          ) : (
                            <ShieldCheck size={20} className="text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <p className="font-medium text-slate-900 dark:text-white">{admin.username}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{admin.email}</td>
                    <td className="px-4 py-4">
                      {admin.isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                          <Crown size={12} />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                      {formatDate(admin.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {currentAdmin?.isSuperAdmin && (
                          <>
                            <Link 
                              href={`/admin/admins/${admin._id}/edit`}
                              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Pencil size={16} />
                            </Link>
                            {!admin.isSuperAdmin && (
                              <button 
                                onClick={() => handleDelete(admin._id)}
                                disabled={deleting === admin._id}
                                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deleting === admin._id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tổng cộng {filteredAdmins?.length || 0} admin
          </p>
        </div>
      </div>
    </div>
  );
}
