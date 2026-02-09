import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useBranding } from '../../../contexts/BrandingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { TenantService } from '../../../services/tenantService';

const Dashboard: React.FC = () => {
  const { tenantId: brandingTenantId } = useBranding();
  const { userProfile, loading: authLoading } = useAuth();

  // Ưu tiên Tenant của Branding (nếu đang đứng ở trang Subdomain), 
  // Nếu không (đứng ở trang chủ Platform), thì lấy Tenant của User đang đăng nhập.
  const tenantId = brandingTenantId || userProfile?.tenantId;

  const [stats, setStats] = useState({
    propertiesForSale: 0,
    newLeads: 0,
    appointments: 0,
    totalBookings: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showApptModal, setShowApptModal] = useState(false);
  const [newAppt, setNewAppt] = useState({ date: new Date().toISOString().split('T')[0], time: '', title: '' });
  const [kpiStats, setKpiStats] = useState({
    revenue: 0,
    commission: 0,
    profit: 0,
    marketingCost: 0,
    target: 500000000,
    deals: 0
  });

  const [homeUrl, setHomeUrl] = useState('/');

  // Resolve Home URL for Tenant
  useEffect(() => {
    const resolveHomeLink = async () => {
      if (tenantId) {
        try {
          const tenant = await TenantService.getTenantById(tenantId);
          if (tenant && tenant.domains && tenant.domains.length > 0) {
            const currentHost = window.location.hostname;
            const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
            const port = window.location.port ? `:${window.location.port}` : '';

            if (isLocalhost) {
              // Tìm domain localhost tùy chỉnh của tenant (VD: hungbds12.localhost)
              const localDomain = tenant.domains.find(d => d.includes('localhost'));

              if (localDomain && localDomain !== currentHost) {
                // Nếu tìm thấy và khác với host hiện tại -> Redirect về đó (giữ nguyên port)
                setHomeUrl(`http://${localDomain}${port}`);
              } else {
                // Nếu không có hoặc đang đứng ở đó rồi -> Về root /
                setHomeUrl('/');
              }
            } else {
              // Nếu ở Production, tìm domain public để redirect về
              const publicDomain = tenant.domains.find(d => !d.includes('localhost') && !d.includes('127.0.0.1'));
              if (publicDomain) {
                setHomeUrl(`https://${publicDomain}`);
              }
            }
          }
        } catch (err) {
          console.error("Error resolving tenant home:", err);
        }
      }
    };
    resolveHomeLink();
  }, [tenantId]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!tenantId) return;
      try {
        // 1. Properties count & Costs
        const propsSnap = await getDocs(query(collection(db, 'properties'), where('tenantId', '==', tenantId)));
        const properties = propsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const propertiesForSale = properties.filter((p: any) => p.status === 'Đang bán').length;
        const totalMarketingSpend = properties.reduce((sum: number, p: any) => sum + (p.adSpend || 0), 0);

        // 2. New Leads (Customers)
        const leadsSnap = await getDocs(query(collection(db, 'customers'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc')));
        const newLeads = leadsSnap.docs.filter(d => (d.data().pipelineStage === 'new' || d.data().status === 'potential')).length;

        // 3. Bookings (Orders) & Financials
        // Make sure to query properly. If tenantId is missing, this query fails or returns empty.
        const bookingsSnap = await getDocs(query(collection(db, 'orders'), where('tenantId', '==', tenantId)));
        const totalBookings = bookingsSnap.size;

        let revenue = 0;
        let cogs = 0; // Cost of Goods Sold
        let completedDeals = 0;
        let commission = 0;

        bookingsSnap.docs.forEach(doc => {
          const d = doc.data();
          // Tính doanh số từ các đơn đã thanh toán (cọc/booking)
          if (d.paymentStatus === 'paid' || d.paymentStatus === 'partially_paid') {
            revenue += (d.total || 0);
            commission += (d.commissionAmount || 0); // Use actual commission if available
            completedDeals++;

            // Calculate COGS if property linked
            if (d.propertyId) {
              const prop: any = properties.find(p => p.id === d.propertyId);
              if (prop) {
                cogs += (prop.costPrice || 0);
              }
            }
          }
        });

        // Nếu orders cũ chưa có field commissionAmount, ta có thể fallback logic cũ (tạm bỏ qua để khuyến khích dùng đơn mới)
        // Profit = Revenue - Commission - COGS - Marketing
        const profit = revenue - commission - cogs - totalMarketingSpend;

        // 4. Appointments
        const apptSnap = await getDocs(query(collection(db, 'appointments'), where('tenantId', '==', tenantId), orderBy('date', 'asc'), orderBy('time', 'asc')));
        const appointments = apptSnap.size;
        setAppointments(apptSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        setStats({ propertiesForSale, newLeads, appointments, totalBookings });
        setKpiStats({ revenue, commission, profit, marketingCost: totalMarketingSpend, target: 500000000, deals: completedDeals });

        // Recent Activities (New Customers)
        setRecentActivities(leadsSnap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error("Error fetching dashboard data", error);
      }
    };

    if (tenantId) {
      fetchStats();
    }
  }, [tenantId]);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.time || !newAppt.title) return;
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...newAppt,
        tenantId,
        createdAt: serverTimestamp()
      });
      setAppointments([...appointments, { id: docRef.id, ...newAppt }]);
      setStats(prev => ({ ...prev, appointments: prev.appointments + 1 }));
      setShowApptModal(false);
      setNewAppt({ date: new Date().toISOString().split('T')[0], time: '', title: '' });
    } catch (error) {
      console.error("Error adding appointment:", error);
    }
  };

  const handleDeleteAppt = async (id: string) => {
    if (!window.confirm("Xóa lịch hẹn này?")) return;
    await deleteDoc(doc(db, 'appointments', id));
    setAppointments(appointments.filter(a => a.id !== id));
    setStats(prev => ({ ...prev, appointments: prev.appointments - 1 }));
  };

  if (authLoading) {
    return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span></div>;
  }

  // Warning if logged in but no tenant connected
  if (!tenantId) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-slate-400">domain_disabled</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Chưa kết nối Tenant</h2>
        <p className="text-slate-500 max-w-md mb-8">Tài khoản của bạn chưa được liên kết với bất kỳ hệ thống Tenant nào. Vui lòng liên hệ Admin để được cấp quyền.</p>
        <Link to="/" className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">Về trang chủ Platform</Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Bảng Điều Khiển</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng quan hoạt động kinh doanh bất động sản.</p>
        </div>

        {/* Nút về trang chủ thông minh */}
        {homeUrl.startsWith('http') ? (
          <a href={homeUrl} className="h-10 px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-all border border-slate-200 bg-white">
            <span className="material-symbols-outlined text-base">arrow_back</span> Về trang chủ
          </a>
        ) : (
          <Link to={homeUrl} className="h-10 px-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-all border border-slate-200 bg-white">
            <span className="material-symbols-outlined text-base">arrow_back</span> Về trang chủ
          </Link>
        )}
      </div>

      {/* KPI & Commission Section (Phase 3) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[200px]">military_tech</span>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest mb-3">
                <span className="material-symbols-outlined text-sm text-yellow-400">star</span>
                KPI Cá Nhân Tháng {new Date().getMonth() + 1}
              </div>
              <h2 className="text-3xl font-display font-bold mb-2">Hiệu Suất & Hoa Hồng</h2>
              <div className="flex gap-4 text-xs font-medium text-slate-400">
                <span>Chi phí Marketing: <strong className="text-white">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(kpiStats.marketingCost)}</strong></span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl min-w-[140px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Doanh số thực</p>
                <p className="text-xl font-black text-white">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(kpiStats.revenue)}
                </p>
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 p-4 rounded-2xl min-w-[140px]">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Lợi nhuận ròng</p>
                <p className="text-xl font-black text-emerald-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(kpiStats.profit)}
                </p>
              </div>
              <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 p-4 rounded-2xl min-w-[140px]">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Hoa hồng (40%)</p>
                <p className="text-xl font-black text-blue-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(kpiStats.commission)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span className="text-slate-300">Tiến độ mục tiêu ({((kpiStats.revenue / kpiStats.target) * 100).toFixed(0)}%)</span>
              <span className="text-white">Mục tiêu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(kpiStats.target)}</span>
            </div>
            <div className="h-6 bg-slate-700/50 rounded-full overflow-hidden p-1 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min((kpiStats.revenue / kpiStats.target) * 100, 100)}%` }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[move_1s_linear_infinite]"></div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic text-right">
              * Hoa hồng được tính tạm tính 40% trên doanh thu phí dịch vụ/cọc.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">apartment</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang bán</p>
              <h3 className="text-2xl font-black text-primary">{stats.propertiesForSale}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">group_add</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khách mới</p>
              <h3 className="text-2xl font-black text-primary">{stats.newLeads}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lịch hẹn</p>
              <h3 className="text-2xl font-black text-primary">{stats.appointments}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking/Cọc</p>
              <h3 className="text-2xl font-black text-primary">{stats.totalBookings}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-primary">Khách hàng quan tâm gần đây</h3>
            <Link to="/consultations" className="text-xs font-bold text-accent hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivities.map((lead, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {lead.name?.charAt(0) || 'K'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{lead.name || 'Khách vãng lai'}</p>
                    <p className="text-xs text-slate-500">{lead.phone || 'Chưa có SĐT'}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-400">{lead.createdAt?.toDate ? new Date(lead.createdAt.toDate()).toLocaleDateString('vi-VN') : 'Vừa xong'}</span>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">Chưa có dữ liệu khách hàng.</div>
            )}
          </div>
        </div>

        {/* Quick Actions / Calendar Placeholder */}
        <div className="space-y-6">
          <div className="bg-primary text-white rounded-2xl p-6 shadow-lg shadow-primary/20">
            <h3 className="font-bold text-lg mb-1">Nhắc việc & Sự kiện</h3>
            <p className="text-primary-light text-sm mb-6">Bạn có {stats.appointments} công việc sắp tới.</p>
            <div className="space-y-3">
              {appointments.length > 0 ? appointments.map(appt => (
                <div key={appt.id} className="bg-white/10 p-3 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center leading-none bg-white/10 p-1.5 rounded-lg min-w-[40px]">
                      <span className="text-[8px] font-bold uppercase opacity-70">{new Date(appt.date).toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                      <span className="text-sm font-black">{new Date(appt.date).getDate()}</span>
                    </div>
                    <span className="text-xs font-bold bg-white text-primary px-2 py-1 rounded">{appt.time}</span>
                    <span className="text-sm font-medium">{appt.title}</span>
                  </div>
                  <button onClick={() => handleDeleteAppt(appt.id)} className="text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )) : (
                <p className="text-white/50 text-sm italic">Chưa có lịch hẹn nào.</p>
              )}
            </div>
            <button
              onClick={() => setShowApptModal(true)}
              className="w-full mt-6 bg-accent hover:bg-accent-light text-white py-3 rounded-xl font-bold text-sm transition-colors"
            >
              Thêm lịch hẹn
            </button>
          </div>
        </div>
      </div>

      {/* Add Appointment Modal */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-primary mb-4">Thêm lịch hẹn mới</h3>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày</label>
                <input type="date" required className="w-full h-10 px-3 rounded-lg border border-slate-200" value={newAppt.date} onChange={e => setNewAppt({ ...newAppt, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giờ</label>
                <input type="time" required className="w-full h-10 px-3 rounded-lg border border-slate-200" value={newAppt.time} onChange={e => setNewAppt({ ...newAppt, time: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nội dung</label>
                <input type="text" required placeholder="VD: Gặp khách A..." className="w-full h-10 px-3 rounded-lg border border-slate-200" value={newAppt.title} onChange={e => setNewAppt({ ...newAppt, title: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowApptModal(false)} className="flex-1 h-10 rounded-lg border border-slate-200 text-slate-500 font-bold text-sm">Hủy</button>
                <button type="submit" className="flex-1 h-10 rounded-lg bg-primary text-white font-bold text-sm">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;