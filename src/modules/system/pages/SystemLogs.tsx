
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, where, Timestamp } from 'firebase/firestore';

interface SystemLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE' | 'PRINT' | 'PAYMENT';
  module: 'ORDER' | 'PROJECT' | 'NEWS' | 'USER' | 'CUSTOMER' | 'SETTING' | 'INGREDIENT';
  detail: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  severity: 'low' | 'medium' | 'high';
}

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Ref để điều khiển ô chọn ngày
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Mặc định là hôm nay
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1); // Reset về trang 1 khi đổi ngày hoặc bộ lọc

    // Tạo mốc thời gian bắt đầu và kết thúc của ngày được chọn
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Truy vấn Firestore lọc theo khoảng thời gian của ngày đã chọn
    const q = query(
      collection(db, 'system_logs'),
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemLog[];
      setLogs(data);
      setLoading(false);
    }, (err) => {
      console.error("Lỗi tải log:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  // Hàm mở lịch chọn ngày khi nhấn vào vùng chỉ định
  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      // Sử dụng showPicker API nếu trình duyệt hỗ trợ, nếu không thì focus
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
        } catch (e) {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  // Logic lọc dữ liệu phía Client (cho các bộ lọc Search, Module, Severity)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
      const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

      return matchesSearch && matchesModule && matchesSeverity;
    });
  }, [logs, searchTerm, moduleFilter, severityFilter]);

  // Logic phân trang
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const stats = useMemo(() => {
    const critical = logs.filter(l => l.severity === 'high').length;
    return {
      totalCount: logs.length,
      criticalCount: critical,
    };
  }, [logs]);

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'DELETE': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'UPDATE': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'LOGIN': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'STATUS_CHANGE': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'PAYMENT': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-rose-500';
      case 'medium': return 'text-amber-500';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-left pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">NHẬT KÝ HỆ THỐNG</h2>
          <div 
            onClick={handleOpenDatePicker}
            className="flex items-center gap-2 text-slate-500 font-medium cursor-pointer hover:text-primary transition-colors group w-fit"
          >
            <span>Giám sát hoạt động Lab ngày {selectedDate.split('-').reverse().join('/')}</span>
            <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">calendar_month</span>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[180px]">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                 <span className="material-symbols-outlined">analytics</span>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng hoạt động</p>
                 <p className="text-xl font-bold text-primary">{stats.totalCount}</p>
              </div>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[180px]">
              <div className="size-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                 <span className="material-symbols-outlined">priority_high</span>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cảnh báo cao</p>
                 <p className="text-xl font-bold text-primary">{stats.criticalCount}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="space-y-1.5 relative">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn ngày truy xuất</label>
           <div className="relative group cursor-pointer" onClick={handleOpenDatePicker}>
              <input 
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border-none bg-slate-50 text-sm font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none cursor-pointer"
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-lg">calendar_month</span>
              </div>
           </div>
        </div>
        <div className="space-y-1.5">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tìm kiếm nội dung</label>
           <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                type="text"
                placeholder="Nội dung, nhân viên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border-none bg-slate-50 text-sm font-medium focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
           </div>
        </div>
        <div className="space-y-1.5">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Module</label>
           <select 
             value={moduleFilter}
             onChange={e => setModuleFilter(e.target.value)}
             className="w-full h-11 px-4 rounded-xl border-none bg-slate-50 text-xs font-bold text-primary cursor-pointer appearance-none focus:ring-4 focus:ring-primary/5"
           >
              <option value="ALL">Tất cả Module</option>
              <option value="ORDER">Đơn hàng</option>
              <option value="PROJECT">Dự án Lab</option>
              <option value="USER">Người dùng</option>
              <option value="NEWS">Tin tức</option>
              <option value="CUSTOMER">Khách hàng</option>
              <option value="INGREDIENT">Hoạt chất</option>
           </select>
        </div>
        <div className="space-y-1.5">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mức độ</label>
           <select 
             value={severityFilter}
             onChange={e => setSeverityFilter(e.target.value)}
             className="w-full h-11 px-4 rounded-xl border-none bg-slate-50 text-xs font-bold text-primary cursor-pointer appearance-none focus:ring-4 focus:ring-primary/5"
           >
              <option value="ALL">Tất cả mức độ</option>
              <option value="low">Thấp (Info)</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao (Critical)</option>
           </select>
        </div>
        <button 
          onClick={() => {setSearchTerm(''); setModuleFilter('ALL'); setSeverityFilter('ALL'); setSelectedDate(new Date().toISOString().split('T')[0]);}}
          className="h-11 px-6 rounded-xl border border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all whitespace-nowrap"
        >
          Đặt lại bộ lọc
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] shadow-card border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Thời gian</th>
                <th className="px-6 py-5">Nhân viên</th>
                <th className="px-6 py-5">Hành động</th>
                <th className="px-6 py-5">Module</th>
                <th className="px-8 py-5">Chi tiết hoạt động</th>
                <th className="px-4 py-5 text-center">!</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center italic text-slate-400">Đang đồng bộ dữ liệu nhật ký...</td></tr>
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                       <p className="text-[11px] font-bold text-slate-900">{log.timestamp.toDate().toLocaleTimeString('vi-VN')}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{log.timestamp.toDate().toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-primary text-[10px] uppercase">
                             {log.userName.substring(0, 2)}
                          </div>
                          <span className="font-bold text-primary">{log.userName}</span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getActionStyle(log.action)}`}>
                         {log.action}
                       </span>
                    </td>
                    <td className="px-6 py-6">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         {log.module}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-md">
                         {log.detail}
                       </p>
                    </td>
                    <td className="px-4 py-6 text-center">
                       <span className={`material-symbols-outlined text-[18px] ${getSeverityStyle(log.severity)}`}>
                         circle
                       </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="p-24 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Không tìm thấy bản ghi nhật ký nào trong ngày {selectedDate.split('-').reverse().join('/')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trên tổng số {filteredLogs.length}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:hover:text-slate-400 shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`size-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:hover:text-slate-400 shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-primary-dark text-white p-8 rounded-[3rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <span className="material-symbols-outlined text-[150px]">security</span>
         </div>
         <div className="relative z-10">
            <h3 className="text-xl font-black font-display uppercase tracking-tight mb-2">Quy định bảo mật Admin</h3>
            <p className="text-accent-light/60 text-sm font-medium max-w-xl">Hệ thống ghi lại tất cả các thao tác nhạy cảm (Xóa dữ liệu, Thay đổi cấu hình, Xuất báo cáo). Nhật ký không thể bị chỉnh sửa để đảm bảo tính minh bạch của dữ liệu R&D.</p>
         </div>
         <button className="relative z-10 px-8 h-12 bg-white text-primary rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-lg active:scale-95">
            Xuất file CSV báo cáo ngày
         </button>
      </div>
    </div>
  );
};

export default SystemLogs;
