
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';
import { useBranding } from '../../../contexts/BrandingContext';

// --- Types ---
type OrderStatus = 'new' | 'confirmed' | 'in_progress' | 'sample_done' | 'delivered' | 'completed' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

interface Order {
  id: string;
  orderId?: string;
  client: { name: string; company?: string; phone?: string };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  type: string;
  createdAt: any;
}

const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: 'Mới Tạo', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  confirmed: { label: 'Đã Xác Nhận', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'Đang Thực Hiện', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  sample_done: { label: 'Đã Xong Mẫu', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  delivered: { label: 'Đã Bàn Giao', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed: { label: 'Đã Hoàn Tất', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Đã Hủy', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

const OrdersToProcess: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canEditStatus = userProfile?.role === 'doctor' || userProfile?.role === 'admin';

  useEffect(() => {
    if (!tenantId) return;
    // Chỉ lấy đơn hàng đã có xác nhận thanh toán (một phần hoặc toàn bộ)
    const q = query(
      collection(db, 'orders'),
      where('tenantId', '==', tenantId),
      where('paymentStatus', 'in', ['partially_paid', 'paid']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // ... (existing code)
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];

      const activeOrders = data.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

      setOrders(activeOrders);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching orders:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    if (!canEditStatus) return;

    const orderToUpdate = orders.find(o => o.id === id);
    if (!orderToUpdate) return;

    const oldStatusLabel = statusLabels[orderToUpdate.status]?.label || orderToUpdate.status;
    const newStatusLabel = statusLabels[newStatus]?.label || newStatus;
    const displayId = orderToUpdate.orderId || orderToUpdate.id.substring(0, 8).toUpperCase();

    setUpdatingId(id);
    try {
      // 1. Cập nhật database chính
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.fullName || 'Doctor'
      });

      // 2. GHI NHẬT KÝ HỆ THỐNG
      await createSystemLog(
        'STATUS_CHANGE',
        'ORDER',
        `Thay đổi trạng thái đơn hàng #${displayId} từ [${oldStatusLabel}] sang [${newStatusLabel}]`,
        userProfile,
        'medium'
      );

    } catch (err) {
      console.error("Update failed:", err);
      alert("Không thể cập nhật trạng thái xử lý.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">ĐƠN HÀNG CẦN XỬ LÝ</h2>
          <p className="text-slate-500 font-medium">Danh sách các đơn hàng đã xác nhận thanh toán & đang trong quy trình Lab.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
            {orders.length} Đơn hàng cần làm
          </div>
        </div>
      </div>

      {!canEditStatus && (
        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          Bạn đang ở chế độ Xem. Chỉ vai trò Doctor/Admin mới có quyền cập nhật trạng thái xử lý.
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Mã đơn</th>
                <th className="px-6 py-5">Khách hàng</th>
                <th className="px-6 py-5">Dịch vụ</th>
                <th className="px-6 py-5">Thanh toán</th>
                <th className="px-10 py-5">Trạng thái xử lý</th>
                <th className="px-8 py-5 text-right">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></td></tr>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <Link
                        to={`/orders/${order.id}`}
                        className="font-mono text-[11px] font-black text-primary hover:text-accent transition-all hover:underline underline-offset-4"
                      >
                        #{order.orderId || order.id.substring(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{order.client?.name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{order.client?.company || 'Khách lẻ'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                        {order.type === 'research' ? 'Nghiên cứu' : order.type === 'formulation' ? 'Công thức' : 'Tư vấn'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-2 py-1 rounded bg-slate-100 text-[9px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Một phần'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      {canEditStatus ? (
                        <div className="relative inline-block w-48">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                            disabled={updatingId === order.id}
                            className={`w-full h-9 pl-3 pr-8 rounded-lg border-none text-[10px] font-black uppercase tracking-widest cursor-pointer focus:ring-4 focus:ring-primary/5 appearance-none ${statusLabels[order.status]?.color} disabled:opacity-50`}
                          >
                            {Object.entries(statusLabels).map(([key, val]) => (
                              <option key={key} value={key} className="bg-white text-slate-900">{val.label}</option>
                            ))}
                          </select>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] pointer-events-none opacity-50">expand_more</span>
                        </div>
                      ) : (
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusLabels[order.status]?.color}`}>
                          {statusLabels[order.status]?.label}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {updatingId === order.id ? (
                        <span className="animate-spin material-symbols-outlined text-primary text-xl">progress_activity</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[10px] font-bold text-slate-300 italic">Auto-save</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <span className="material-symbols-outlined text-6xl">order_approve</span>
                      <p className="font-bold uppercase tracking-widest text-xs">Không có đơn hàng nào chờ xử lý Lab</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
        <span className="material-symbols-outlined text-primary">lab_profile</span>
        <div className="text-xs text-slate-500 leading-relaxed font-medium">
          <p className="font-bold text-primary uppercase mb-1 tracking-widest text-[9px]">Ghi chú cho Bác sĩ / Kỹ thuật viên:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Dây chuyền Lab chỉ hiển thị các đơn hàng đã có xác nhận thanh toán từ bộ phận Marketing.</li>
            <li>Sau khi hoàn thành mẫu (Sample Done), vui lòng cập nhật trạng thái để Marketing bàn giao cho khách hàng.</li>
            <li>Khi đơn hàng đạt trạng thái "Đã Hoàn Tất", nó sẽ tự động được ẩn khỏi danh sách này.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrdersToProcess;
