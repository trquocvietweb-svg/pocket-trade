'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import SeedManager from './SeedManager';

type TimeRange = 'today' | 'week' | 'month' | '3months' | 'year' | 'all';

const timeRangeLabels: Record<TimeRange, string> = {
  today: 'Hôm nay',
  week: '7 ngày',
  month: '30 ngày',
  '3months': '3 tháng',
  year: '1 năm',
  all: 'Tất cả',
};

const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  
  const stats = useQuery(api.visitors.getStats, { timeRange });
  const chartData = useQuery(api.visitors.getChartData, { timeRange });
  const topPages = useQuery(api.visitors.getTopPages, { timeRange });
  const topReferrers = useQuery(api.visitors.getTopReferrers, { timeRange });
  const topCountries = useQuery(api.visitors.getCountryStats, { timeRange });
  const devices = useQuery(api.visitors.getDeviceStats, { timeRange });
  const operatingSystems = useQuery(api.visitors.getOsStats, { timeRange });

  const isLoading = !stats || !chartData || !topPages || !topReferrers || !topCountries || !devices || !operatingSystems;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thống kê truy cập</h1>
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {(Object.keys(timeRangeLabels) as TimeRange[]).map((key) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeRange === key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {timeRangeLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Người truy cập</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.visitors.toLocaleString('vi-VN')}
                </span>
                {stats.visitorsChange !== 0 && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${stats.visitorsChange > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {stats.visitorsChange > 0 ? '+' : ''}{stats.visitorsChange}%
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Lượt xem trang</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.pageViews.toLocaleString('vi-VN')}
                </span>
                {stats.pageViewsChange !== 0 && (
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${stats.pageViewsChange > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {stats.pageViewsChange > 0 ? '+' : ''}{stats.pageViewsChange}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorVisitors)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Trang được xem</h3>
              <div className="space-y-2">
                {topPages.length > 0 ? topPages.map((page) => (
                  <div key={page.path} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${(page.visitors / topPages[0].visitors) * 60}%` }}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{page.path}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white ml-2">{page.visitors}</span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">Chưa có dữ liệu</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Nguồn truy cập</h3>
              <div className="space-y-2">
                {topReferrers.length > 0 ? topReferrers.map((ref) => (
                  <div key={ref.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="h-2 bg-emerald-500 rounded-full"
                        style={{ width: `${(ref.visitors / topReferrers[0].visitors) * 60}%` }}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{ref.source}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white ml-2">{ref.visitors}</span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">Chưa có dữ liệu</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quốc gia</h3>
              <div className="space-y-2">
                {topCountries.length > 0 ? topCountries.map((c) => (
                  <div key={c.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{c.country}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{c.percent}%</span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400">Chưa có dữ liệu</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Thiết bị</h3>
                  <div className="space-y-2">
                    {devices.length > 0 ? devices.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{d.name}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{d.percent}%</span>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-400">Chưa có dữ liệu</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Hệ điều hành</h3>
                  <div className="space-y-2">
                    {operatingSystems.length > 0 ? operatingSystems.map((os) => (
                      <div key={os.name} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{os.name}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{os.percent}%</span>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-400">Chưa có dữ liệu</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seed Manager */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <SeedManager />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
