
import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';

interface ResponseLog {
  date: string;
  content: string;
  author: string;
}

interface Inquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  interest: string;
  message: string;
  status: 'new' | 'processing' | 'done';
  createdAt: any;
  logs?: ResponseLog[];
}

const ConsultationRequests: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'processing' | 'done'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  // States cho việc xóa và nhật ký
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newLogText, setNewLogText] = useState('');
  const [addingLog, setAddingLog] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'inquiries'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Inquiry[];
      setInquiries(data);
      setLoading(false);

      if (selectedInquiry) {
        const updated = data.find(i => i.id === selectedInquiry.id);
        if (updated) setSelectedInquiry(updated);
      }
    }, (error) => {
      console.error("Error fetching inquiries:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedInquiry?.id, tenantId]);

  const filteredInquiries = useMemo(() => {
    if (filter === 'all') return inquiries;
    return inquiries.filter(i => i.status === filter);
  }, [inquiries, filter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'inquiries', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
    }
  };

  const handleAddLog = async () => {
    if (!selectedInquiry || !newLogText.trim() || addingLog) return;

    setAddingLog(true);
    try {
      const logEntry: ResponseLog = {
        date: new Date().toLocaleString('vi-VN'),
        content: newLogText.trim(),
        author: userProfile?.fullName || 'Chuyên viên tư vấn'
      };

      await updateDoc(doc(db, 'inquiries', selectedInquiry.id), {
        logs: arrayUnion(logEntry),
        ...(selectedInquiry.status === 'new' ? { status: 'processing' } : {})
      });

      setNewLogText('');
    } catch (error) {
      console.error("Lỗi khi thêm nhật ký:", error);
      alert("Không thể lưu nhật ký. Vui lòng thử lại.");
    } finally {
      setAddingLog(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'inquiries', deleteTarget.id));
      if (selectedInquiry?.id === deleteTarget.id) setSelectedInquiry(null);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert("Đã có lỗi xảy ra khi xóa yêu cầu.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'processing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'done': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const getInterestName = (id: string) => {
    const map: any = {
      'buy': 'Mua Bất Động Sản',
      'rent': 'Thuê Bất Động Sản',
      'invest': 'Đầu tư',
      'consult': 'Tư vấn pháp lý',
      'cosmetics': 'Mỹ phẩm & Chăm sóc da',
      'supplements': 'Thực phẩm chức năng',
      'rd_service': 'Dịch vụ R&D trọn gói'
    };
    return map[id] || id;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Popup xác nhận xóa */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="size-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="material-symbols-outlined text-4xl filled-icon">warning</span>
              </div>
              <h3 className="text-2xl font-black text-primary font-display mb-2 uppercase tracking-tight">Xóa yêu cầu?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                Bạn sắp xóa vĩnh viễn yêu cầu tư vấn của khách hàng <span className="text-rose-600 font-bold">"{deleteTarget.name}"</span>.
                Dữ liệu này sẽ không thể khôi phục.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                {isDeleting ? <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span> : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
        <div>
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">YÊU CẦU TƯ VẤN</h2>
          <p className="text-slate-500 font-medium">Danh sách khách hàng đăng ký tư vấn bất động sản.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
          {['all', 'new', 'processing', 'done'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
            >
              {f === 'all' ? 'Tất cả' : f === 'new' ? 'Mới' : f === 'processing' ? 'Đang xử lý' : 'Xong'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-card border border-slate-100 overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Khách hàng</th>
                <th className="px-6 py-5">Lĩnh vực</th>
                <th className="px-6 py-5">Ngày gửi</th>
                <th className="px-6 py-5">Trạng thái</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center italic text-slate-400">Đang tải dữ liệu...</td></tr>
              ) : filteredInquiries.length > 0 ? (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{inquiry.fullName}</span>
                        <span className="text-xs text-slate-400 font-medium">{inquiry.email} • {inquiry.phone}</span>
                        {inquiry.company && <span className="text-[10px] text-accent font-black uppercase mt-1">Cty: {inquiry.company}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-xs font-bold text-slate-600">{getInterestName(inquiry.interest)}</span>
                    </td>
                    <td className="px-6 py-6 text-slate-500 font-medium whitespace-nowrap">
                      {inquiry.createdAt?.toDate().toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-6">
                      <select
                        value={inquiry.status}
                        onChange={(e) => updateStatus(inquiry.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer outline-none ${getStatusBadge(inquiry.status)}`}
                      >
                        <option value="new">Mới</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="done">Hoàn thành</option>
                      </select>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-none hover:shadow-sm"
                          title="Xem chi tiết & Nhật ký"
                        >
                          <span className="material-symbols-outlined text-[22px]">quick_reference_all</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: inquiry.id, name: inquiry.fullName })}
                          className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-20 text-center italic text-slate-400">Không tìm thấy yêu cầu nào phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal chi tiết & Nhật ký */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300 flex flex-col h-[90vh] text-left">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary font-display uppercase tracking-tight">{selectedInquiry.fullName}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Chi tiết yêu cầu & Nhật ký xử lý</p>
                </div>
              </div>
              <button onClick={() => setSelectedInquiry(null)} className="size-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Cột trái: Thông tin yêu cầu */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto border-r border-slate-50 space-y-8 bg-slate-50/20">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                    <p className="text-sm font-bold text-primary">{selectedInquiry.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                    <p className="text-sm font-bold text-primary">{selectedInquiry.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Công ty</p>
                    <p className="text-sm font-bold text-primary">{selectedInquiry.company || 'Cá nhân'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lĩnh vực</p>
                    <p className="text-sm font-bold text-primary">{getInterestName(selectedInquiry.interest)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung tin nhắn gốc</p>
                  <div className="p-6 rounded-2xl bg-white border border-slate-100 text-slate-700 text-sm leading-relaxed font-medium shadow-sm">
                    {selectedInquiry.message}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Phản hồi từ KyNguyen Real AI`}
                    className="w-full h-12 bg-white border border-primary text-primary rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                    Gửi Email phản hồi trực tiếp
                  </a>
                </div>
              </div>

              {/* Cột phải: Nhật ký xử lý */}
              <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col space-y-6">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent text-lg">history</span> NHẬT KÝ PHẢN HỒI
                </h4>

                {/* Form thêm log */}
                <div className="space-y-3 p-5 rounded-2xl bg-primary/5 border border-primary/10">
                  <textarea
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Nhập nội dung cập nhật tình hình làm việc..."
                    className="w-full p-4 rounded-xl border-none bg-white text-sm font-medium focus:ring-4 focus:ring-primary/5 min-h-[80px] resize-none outline-none shadow-sm"
                  />
                  <button
                    onClick={handleAddLog}
                    disabled={!newLogText.trim() || addingLog}
                    className="px-6 h-10 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {addingLog ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">add</span>}
                    Lưu cập nhật
                  </button>
                </div>

                {/* Danh sách log (Timeline) */}
                <div className="flex-1 space-y-6 pt-4">
                  {selectedInquiry.logs && selectedInquiry.logs.length > 0 ? (
                    [...selectedInquiry.logs].reverse().map((log, idx) => (
                      <div key={idx} className="relative pl-8 pb-2">
                        {/* Đường line timeline */}
                        {idx !== selectedInquiry.logs!.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100"></div>}

                        <div className="absolute left-0 top-1 size-6 rounded-full bg-white border-2 border-accent flex items-center justify-center z-10 shadow-sm">
                          <div className="size-2 rounded-full bg-accent"></div>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm group hover:border-accent/30 transition-all">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.date}</span>
                            <span className="text-[9px] font-bold text-primary bg-slate-50 px-2 py-0.5 rounded">{log.author}</span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium leading-relaxed">{log.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                      <span className="material-symbols-outlined text-5xl mb-2 opacity-20">history</span>
                      <p className="text-xs font-bold uppercase tracking-widest">Chưa có nhật ký xử lý</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setSelectedInquiry(null)} className="px-8 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all">Đóng cửa sổ</button>
              <button
                onClick={() => updateStatus(selectedInquiry.id, 'done')}
                disabled={selectedInquiry.status === 'done'}
                className="px-8 h-12 bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Đánh dấu Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationRequests;
