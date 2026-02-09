
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { seedPlatformData } from '../../../seedPlatformData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PlatformDashboard: React.FC = () => {
   const { userProfile } = useAuth();
   const [stats, setStats] = useState({
      totalTenants: 0,
      activeTenants: 0,
      totalRevenue: 0,
      totalUsers: 0
   });
   const [recentTenants, setRecentTenants] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // Mock Data for Revenue Chart
   const revenueData = [
      { name: 'T1', revenue: 40000000 },
      { name: 'T2', revenue: 35000000 },
      { name: 'T3', revenue: 50000000 },
      { name: 'T4', revenue: 45000000 },
      { name: 'T5', revenue: 60000000 },
      { name: 'T6', revenue: 75000000 },
      { name: 'T7', revenue: 80000000 },
   ];

   useEffect(() => {
      const fetchData = async () => {
         try {
            // 1. Fetch Tenants
            const tenantsRef = collection(db, 'tenants');
            const tenantsSnap = await getDocs(tenantsRef);

            let activeCount = 0;
            let revenue = 0;
            const tenantsList: any[] = [];

            tenantsSnap.forEach(doc => {
               const data = doc.data();
               tenantsList.push({ id: doc.id, ...data });
               if (data.status === 'active') activeCount++;

               // Mock revenue calculation based on plan
               if (data.plan === 'enterprise') revenue += 5000000;
               else if (data.plan === 'pro') revenue += 2000000;
               else revenue += 500000; // basic
            });

            // Sort manually since we fetched all
            tenantsList.sort((a, b) => {
               const timeA = a.createdAt?.seconds || 0;
               const timeB = b.createdAt?.seconds || 0;
               return timeB - timeA;
            });

            // 2. Fetch Users (Just a count estimate for now)
            const usersSnap = await getDocs(collection(db, 'users'));

            setStats({
               totalTenants: tenantsSnap.size,
               activeTenants: activeCount,
               totalRevenue: revenue * 12, // Annualize for impressive numbers
               totalUsers: usersSnap.size
            });

            setRecentTenants(tenantsList.slice(0, 5));
         } catch (error) {
            console.error("Error loading dashboard:", error);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, []);

   const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

   return (
      <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 space-y-8 font-body">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1.5">
                     <span className="size-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                     Super Admin Mode
                  </span>
               </div>
               <h2 className="text-3xl font-black text-slate-800 font-display tracking-tight uppercase">PLATFORM OVERVIEW</h2>
               <p className="text-slate-500 font-medium mt-1">Theo dõi hiệu suất và tăng trưởng toàn hệ thống.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                  <span className="flex size-2 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Operational</span>
               </div>
            </div>
         </div>

         {/* Stats Grid - Light & Professional Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-card relative overflow-hidden group hover:shadow-lg transition-all">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div className="size-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">domain</span>
                     </div>
                     <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">+12%</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Tenants</p>
                  <p className="text-3xl font-black text-slate-800">{stats.totalTenants}</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-card relative overflow-hidden group hover:shadow-lg transition-all">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">verified_user</span>
                     </div>
                     <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">Active</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tenant Hoạt Động</p>
                  <p className="text-3xl font-black text-slate-800">{stats.activeTenants}</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-card relative overflow-hidden group hover:shadow-lg transition-all">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div className="size-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">group</span>
                     </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Users</p>
                  <p className="text-3xl font-black text-slate-800">{stats.totalUsers}</p>
               </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] shadow-xl shadow-indigo-500/20 relative overflow-hidden group text-white">
               <div className="absolute top-0 right-0 p-4 opacity-10 bg-white blur-3xl rounded-full size-40 -mr-10 -mt-10"></div>
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                     <div className="size-12 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                     </div>
                  </div>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Doanh thu (ARR)</p>
                  <p className="text-2xl font-black">{formatCurrency(stats.totalRevenue)}</p>
               </div>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Layout 2/3: Revenue Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-card">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Biểu đồ doanh thu</h3>
                     <p className="text-slate-400 text-xs font-medium">Theo dõi dòng tiền ra vào hệ thống</p>
                  </div>
                  <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 hover:bg-slate-100 transition-colors cursor-pointer">
                     <option>7 ngày qua</option>
                     <option>Tháng này</option>
                     <option>Năm nay</option>
                  </select>
               </div>
               <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={revenueData}>
                        <defs>
                           <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                           dataKey="name"
                           stroke="#94a3b8"
                           tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                           tickLine={false}
                           axisLine={false}
                           dy={10}
                        />
                        <YAxis
                           stroke="#94a3b8"
                           tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                           tickLine={false}
                           axisLine={false}
                           tickFormatter={(value) => `${value / 1000000}M`}
                        />
                        <Tooltip
                           contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '1rem', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                           itemStyle={{ color: '#4f46e5', fontWeight: 700 }}
                           formatter={(value: number) => formatCurrency(value)}
                        />
                        <Area
                           type="monotone"
                           dataKey="revenue"
                           stroke="#4f46e5"
                           strokeWidth={3}
                           fillOpacity={1}
                           fill="url(#colorRevenue)"
                           activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                        />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Layout 1/3: Quick Actions & Recent */}
            <div className="space-y-6">

               {/* Recent Tenants Mini Table */}
               <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-card flex flex-col h-[450px]">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Khách hàng mới</h3>
                     <Link to="/platform/tenants" className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg transition-colors">XEM TẤT CẢ</Link>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                     {loading ? (
                        <div className="text-center p-8 text-slate-400 text-xs">Loading...</div>
                     ) : recentTenants.length > 0 ? (
                        <div className="space-y-1">
                           {recentTenants.map((t, idx) => (
                              <div key={t.id} className="p-3 hover:bg-slate-50 rounded-2xl transition-all flex items-center gap-3 group cursor-pointer border border-transparent hover:border-slate-100">
                                 <div className={`size-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm uppercase ${idx % 3 === 0 ? 'bg-indigo-500' : idx % 3 === 1 ? 'bg-rose-500' : 'bg-amber-500'
                                    }`}>
                                    {t.name.substring(0, 1)}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{t.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">{t.contactEmail}</p>
                                 </div>
                                 <span className={`size-2 rounded-full ${t.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm ring-2 ring-white`}></span>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center p-8 text-slate-400 text-xs">Chưa có dữ liệu</div>
                     )}
                  </div>
               </div>

               {/* Quick Actions Panel */}
               <div className="bg-slate-800 text-white rounded-[2rem] p-6 shadow-xl shadow-slate-800/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 bg-indigo-500 opacity-20 blur-3xl rounded-full -mr-10 -mt-10"></div>

                  <h3 className="text-sm font-black text-white/50 uppercase tracking-widest mb-4 relative z-10">Phím tắt</h3>
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                     <Link to="/platform/tenants" className="flex flex-col items-center justify-center gap-2 p-4 bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/10 rounded-2xl transition-all group backdrop-blur-sm">
                        <span className="material-symbols-outlined text-indigo-300 group-hover:scale-110 transition-transform">add_business</span>
                        <span className="text-[10px] font-bold text-slate-300 group-hover:text-white">Thêm Tenant</span>
                     </Link>
                     <Link to="/platform/settings" className="flex flex-col items-center justify-center gap-2 p-4 bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/10 rounded-2xl transition-all group backdrop-blur-sm">
                        <span className="material-symbols-outlined text-slate-400 group-hover:scale-110 transition-transform">settings</span>
                        <span className="text-[10px] font-bold text-slate-300 group-hover:text-white">Cấu hình</span>
                     </Link>
                     <button onClick={seedPlatformData} className="col-span-2 flex items-center justify-center gap-2 p-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/20 rounded-xl transition-all group mt-1">
                        <span className="material-symbols-outlined text-rose-400 text-sm">database</span>
                        <span className="text-[10px] font-bold text-rose-300">Seed Data (Dev)</span>
                     </button>
                  </div>
               </div>

            </div>
         </div>
      </div>
   );
};

export default PlatformDashboard;
