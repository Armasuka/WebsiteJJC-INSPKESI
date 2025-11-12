"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface InspeksiItem {
  id: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  status: string;
  tanggalInspeksi: string;
  approvedByTraffic?: string;
  approvedByOperational?: string;
  approvedAtTraffic?: string;
  approvedAtOperational?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionNote?: string;
  merkKendaraan?: string;
  lokasiInspeksi?: string;
}

interface ChartData {
  byCategory: { name: string; value: number; color: string }[];
  byDate: { date: string; count: number }[];
  totalInspections: number;
  byStatus: { name: string; value: number; color: string }[];
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
}

type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function PetugasLapanganDashboard() {
  const { data: session } = useSession();
  const [recentInspeksi, setRecentInspeksi] = useState<InspeksiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData>({ 
    byCategory: [], 
    byDate: [], 
    totalInspections: 0,
    byStatus: [],
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0
  });
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loadingCharts, setLoadingCharts] = useState(true);

  useEffect(() => {
    fetchData();
    fetchChartData();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [filterPeriod, customStartDate, customEndDate]);

  const fetchData = async () => {
    try {
      // Optimasi: Hanya muat 5 data terbaru untuk dashboard
      const response = await fetch("/api/inspeksi?limit=5");
      if (response.ok) {
        const result = await response.json();
        
        // Handle both old and new response format
        const data = result.data || result;
        setRecentInspeksi(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (filterPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchChartData = async () => {
    if (filterPeriod === 'custom' && (!customStartDate || !customEndDate)) {
      return;
    }

    setLoadingCharts(true);
    try {
      const { startDate, endDate } = getDateRange();
      console.log('[CHART] Fetching data with date range:', { startDate, endDate });
      
      const response = await fetch(`/api/inspeksi?startDate=${startDate}&endDate=${endDate}`);
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        
        console.log('[CHART] Raw data received:', data);
        console.log('[CHART] Total inspections:', data.length);

        // API already filters by petugasId for PETUGAS_LAPANGAN role
        const userInspections = data;
        console.log('[CHART] User inspections count:', userInspections.length);

        // Group by category with vibrant colors
        const categoryColors: { [key: string]: string } = {
          'PLAZA': '#3b82f6',    // Blue-500 - Bright Blue
          'Plaza': '#3b82f6',    // Blue-500 - Bright Blue (fallback)
          'DEREK': '#8b5cf6',    // Violet-500 - Bright Violet
          'Derek': '#8b5cf6',    // Violet-500 - Bright Violet (fallback)
          'KAMTIB': '#eab308',   // Yellow-500 - Bright Yellow
          'Kamtib': '#eab308',   // Yellow-500 - Bright Yellow (fallback)
          'RESCUE': '#ec4899',   // Pink-500 - Bright Pink
          'Rescue': '#ec4899'    // Pink-500 - Bright Pink (fallback)
        };

        const categoryCount: { [key: string]: number } = {};
        userInspections.forEach((item: InspeksiItem) => {
          console.log('[CHART] Processing item:', item.kategoriKendaraan, item.nomorKendaraan);
          categoryCount[item.kategoriKendaraan] = (categoryCount[item.kategoriKendaraan] || 0) + 1;
        });

        console.log('[CHART] Category count:', categoryCount);

        const byCategory = Object.entries(categoryCount).map(([name, value]) => ({
          name,
          value,
          color: categoryColors[name] || categoryColors[name.toLowerCase()] || categoryColors[name.toUpperCase()] || '#6366f1' // Fallback to Indigo-500
        }));

        console.log('[CHART] By category:', byCategory);

        // Group by date for bar chart
        const dateCount: { [key: string]: number } = {};
        userInspections.forEach((item: InspeksiItem) => {
          const date = new Date(item.tanggalInspeksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
          dateCount[date] = (dateCount[date] || 0) + 1;
        });

        console.log('[CHART] Date count:', dateCount);

        // Sort dates and take last 10
        const byDate = Object.entries(dateCount)
          .map(([date, count]) => ({ date, count }))
          .slice(-10); // Last 10 dates

        console.log('[CHART] By date:', byDate);

        // Group by status for approval/rejection statistics
        const statusCount = {
          approved: 0,
          rejected: 0,
          pending: 0
        };

        userInspections.forEach((item: InspeksiItem) => {
          if (item.status === 'APPROVED_BY_OPERATIONAL' || item.status === 'APPROVED_BY_TRAFFIC') {
            statusCount.approved += 1;
          } else if (item.status === 'REJECTED') {
            statusCount.rejected += 1;
          } else if (item.status === 'SUBMITTED') {
            statusCount.pending += 1;
          }
        });

        const byStatus = [
          { name: 'Disetujui', value: statusCount.approved, color: '#22c55e' },  // Green-500
          { name: 'Ditolak', value: statusCount.rejected, color: '#f43f5e' },    // Rose-500
          { name: 'Menunggu', value: statusCount.pending, color: '#f97316' }     // Orange-500
        ].filter(item => item.value > 0); // Only show categories with data

        console.log('[CHART] Status count:', statusCount);
        console.log('[CHART] By status:', byStatus);

        const chartDataResult = {
          byCategory,
          byDate,
          totalInspections: userInspections.length,
          byStatus,
          approvedCount: statusCount.approved,
          rejectedCount: statusCount.rejected,
          pendingCount: statusCount.pending
        };

        console.log('[CHART] Final chart data:', chartDataResult);
        setChartData(chartDataResult);
      }
    } catch (error) {
      console.error("[CHART] Error fetching chart data:", error);
    } finally {
      setLoadingCharts(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Welcome Header - Clean Design */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-600 p-4 sm:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Dashboard Petugas Lapangan</h1>
        <p className="text-sm sm:text-base text-gray-600">Selamat datang kembali, <span className="font-bold text-blue-600">{session?.user?.name}</span></p>
      </div>

      {/* Status Laporan Inspeksi - Clean Design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-700 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">Status Laporan Inspeksi</h3>
              <p className="text-xs sm:text-sm text-blue-100 truncate">Persetujuan dari Manager Traffic & Manager Operational</p>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="text-gray-700 mt-4 font-semibold text-sm sm:text-base">Memuat data inspeksi...</p>
          </div>
        ) : recentInspeksi.length === 0 ? (
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Belum Ada Laporan Inspeksi</h4>
            <p className="text-sm sm:text-base text-gray-700 font-medium">Buat inspeksi pertama Anda untuk melihat status di sini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentInspeksi.map((item, index) => (
              <div key={item.id} className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 hover:bg-blue-50 transition-colors duration-200 group" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4 sm:gap-6">
                  <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                    {/* Header */}
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                          {item.kategoriKendaraan} - {item.nomorKendaraan}
                        </h4>
                        <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold ${
                          item.status === 'APPROVED_BY_OPERATIONAL' ? 'bg-green-100 text-green-700' :
                          item.status === 'APPROVED_BY_TRAFFIC' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                          item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {(item.status === 'APPROVED_BY_OPERATIONAL' || item.status === 'APPROVED_BY_TRAFFIC') && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {item.status === 'SUBMITTED' && (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          )}
                          {item.status === 'APPROVED_BY_OPERATIONAL' ? 'FULLY APPROVED' :
                           item.status === 'APPROVED_BY_TRAFFIC' ? 'APPROVED BY TRAFFIC' :
                           item.status === 'SUBMITTED' ? 'MENUNGGU APPROVAL' :
                           item.status === 'REJECTED' ? 'DITOLAK' :
                           'DRAFT'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Manager Approval Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Manager Traffic */}
                      <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-blue-900 truncate">Manager Traffic</p>
                        </div>
                        {item.status === "REJECTED" && item.rejectedBy === "TRAFFIC" ? (
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs sm:text-sm font-bold text-red-700">DITOLAK</span>
                            </div>
                            {item.rejectedAt && (
                              <p className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="truncate">{new Date(item.rejectedAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}</span>
                              </p>
                            )}
                          </div>
                        ) : item.approvedByTraffic ? (
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs sm:text-sm font-bold text-green-700">Telah Disetujui</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate">{new Date(item.approvedAtTraffic!).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs sm:text-sm font-medium text-amber-700 truncate">Menunggu Persetujuan</span>
                          </div>
                        )}
                      </div>

                      {/* Manager Operational */}
                      <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200 hover:border-purple-300 transition-colors">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-purple-900 truncate">Manager Operational</p>
                        </div>
                        {item.status === "REJECTED" && item.rejectedBy === "OPERATIONAL" ? (
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs sm:text-sm font-bold text-red-700">DITOLAK</span>
                            </div>
                            {item.rejectedAt && (
                              <p className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="truncate">{new Date(item.rejectedAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}</span>
                              </p>
                            )}
                          </div>
                        ) : item.approvedByOperational ? (
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs sm:text-sm font-bold text-green-700">Telah Disetujui</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate">{new Date(item.approvedAtOperational!).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs sm:text-sm font-medium text-amber-700 truncate">Menunggu Persetujuan</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inspection Date */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 font-medium pt-2 border-t border-gray-100">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Tanggal Inspeksi:</span>
                      <span className="truncate">{new Date(item.tanggalInspeksi).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}</span>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.id}`} className="w-full lg:w-auto">
                    <button className="w-full lg:w-auto flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors duration-200 shadow-sm hover:shadow text-sm sm:text-base">
                      <span className="flex items-center justify-center gap-2">
                        Lihat Detail
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Analytics - Charts and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-blue-700 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">Statistik Inspeksi</h3>
                <p className="text-xs sm:text-sm text-blue-100 truncate">Total: {chartData.totalInspections} inspeksi</p>
              </div>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full lg:w-auto">
              <button
                onClick={() => setFilterPeriod('today')}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                  filterPeriod === 'today' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setFilterPeriod('week')}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                  filterPeriod === 'week' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                Minggu Ini
              </button>
              <button
                onClick={() => setFilterPeriod('month')}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                  filterPeriod === 'month' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setFilterPeriod('year')}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                  filterPeriod === 'year' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                Tahun Ini
              </button>
              <button
                onClick={() => setFilterPeriod('custom')}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                  filterPeriod === 'custom' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {filterPeriod === 'custom' && (
            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
              <label className="text-white text-xs sm:text-sm font-semibold flex-shrink-0">Dari:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-blue-800 bg-blue-700 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white text-sm"
              />
              <label className="text-white text-xs sm:text-sm font-semibold flex-shrink-0">Sampai:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-blue-800 bg-blue-700 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white text-sm"
              />
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            {/* Total Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 sm:p-5 lg:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-blue-600 bg-opacity-50 p-2 sm:p-3 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-1">{chartData.totalInspections}</div>
              <div className="text-blue-100 text-xs sm:text-sm font-medium">Total Inspeksi</div>
            </div>

            {/* Approved Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-4 sm:p-5 lg:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-emerald-600 bg-opacity-50 p-2 sm:p-3 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-1">{chartData.approvedCount}</div>
              <div className="text-emerald-100 text-xs sm:text-sm font-medium">Disetujui</div>
            </div>

            {/* Rejected Card */}
            <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl p-4 sm:p-5 lg:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-rose-600 bg-opacity-50 p-2 sm:p-3 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-1">{chartData.rejectedCount}</div>
              <div className="text-rose-100 text-xs sm:text-sm font-medium">Ditolak</div>
            </div>

            {/* Pending Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-4 sm:p-5 lg:p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-orange-600 bg-opacity-50 p-2 sm:p-3 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-1">{chartData.pendingCount}</div>
              <div className="text-orange-100 text-xs sm:text-sm font-medium">Menunggu Persetujuan</div>
            </div>
          </div>
        </div>

        {/* Charts Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {loadingCharts ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : chartData.totalInspections === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-sm sm:text-base text-gray-600">Tidak ada data inspeksi pada periode yang dipilih</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Status Approval/Rejection Chart */}
              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="truncate">Status Persetujuan</span>
                </h4>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-100">
                  {chartData.byStatus.length > 0 ? (
                    <div className="w-full" style={{ minHeight: '250px' }}>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={chartData.byStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => {
                              // Simplified label for mobile
                              if (window.innerWidth < 640) {
                                return `${entry.value}`;
                              }
                              return `${entry.name}: ${entry.value}`;
                            }}
                            outerRadius={window.innerWidth < 640 ? 60 : 80}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="#ffffff"
                            strokeWidth={2}
                          >
                            {chartData.byStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '11px'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{
                              paddingTop: '10px',
                              fontSize: '11px'
                            }}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-10 text-sm">
                      <p>Belum ada data status</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pie Chart - Distribution by Category */}
              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                  </div>
                  <span className="truncate">Kategori Kendaraan</span>
                </h4>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100">
                  <div className="w-full" style={{ minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={chartData.byCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => {
                            // Simplified label for mobile
                            if (typeof window !== 'undefined' && window.innerWidth < 640) {
                              return `${entry.value}`;
                            }
                            return `${entry.name}: ${entry.value}`;
                          }}
                          outerRadius={typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                          stroke="#ffffff"
                          strokeWidth={2}
                        >
                          {chartData.byCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '11px'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            paddingTop: '10px',
                            fontSize: '11px'
                          }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bar Chart - Trend over Time */}
              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <span className="truncate">Tren Inspeksi</span>
                </h4>
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-teal-100">
                  <div className="w-full" style={{ minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={chartData.byDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" style={{ fontSize: '10px' }} />
                        <YAxis style={{ fontSize: '10px' }} />
                        <Tooltip contentStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="count" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box - Clean Design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-700 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">Panduan Inspeksi Kendaraan</h3>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="truncate">Kategori Kendaraan</span>
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base truncate">Plaza - Kendaraan Operasional</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base truncate">Derek - Kendaraan Evakuasi</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base truncate">Kamtib - Kendaraan Keamanan</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base truncate">Rescue - Kendaraan Penyelamatan</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className="truncate">Langkah Inspeksi</span>
              </h4>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { num: 1, text: "Pilih kategori kendaraan" },
                  { num: 2, text: "Isi informasi dasar & lokasi GPS" },
                  { num: 3, text: "Cek kelengkapan sarana & kendaraan" },
                  { num: 4, text: "Upload dokumen & foto" },
                  { num: 5, text: "Tanda tangan digital" }
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm">
                      {step.num}
                    </div>
                    <p className="text-gray-700 font-medium flex-1 pt-1 text-sm sm:text-base">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

