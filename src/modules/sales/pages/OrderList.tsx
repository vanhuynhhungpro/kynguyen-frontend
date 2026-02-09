import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc, where } from 'firebase/firestore';
import { useBranding } from '../../../contexts/BrandingContext';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  customerName: string;
  propertyName: string;
  amount: number;
  status: string;
  date: any;
  code: string;
}

import { useAuth } from '../../../contexts/AuthContext';

const ManageOrders: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId: brandingTenantId } = useBranding();
  // Fallback tenantId từ AuthProfile nếu không có brandingTenantId (lỗi domain chính)
  const tenantId = brandingTenantId || userProfile?.tenantId;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (!tenantId) return;
      const q = query(collection(db, 'orders'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        customerName: doc.data().customerName || 'Khách hàng',
        propertyName: doc.data().propertyName || 'Dự án BĐS',
        amount: doc.data().total || 0,
        status: doc.data().status || 'pending',
        code: doc.data().orderCode || doc.id.substring(0, 6).toUpperCase()
      } as Order));
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa giao dịch #${code} không? Hành động này không thể hoàn tác.`)) return;

    try {
      await deleteDoc(doc(db, 'orders', id));
      setOrders(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Đã có lỗi xảy ra khi xóa.");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tenantId]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Quản Lý Booking / Đặt Cọc</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi các giao dịch đặt chỗ và đặt cọc.</p>
        </div>
        <Link
          to="/orders/new"
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Tạo phiếu cọc
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Mã Phiếu</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Khách Hàng</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Bất Động Sản</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Số Tiền</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Trạng Thái</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Chưa có giao dịch nào.</td></tr>
              ) : (
                orders.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">#{item.code}</td>
                    <td className="px-6 py-4 font-bold text-primary">{item.customerName}</td>
                    <td className="px-6 py-4 text-slate-600">{item.propertyName}</td>
                    <td className="px-6 py-4 font-bold text-accent">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                        ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'}`}>
                        {item.status === 'completed' ? 'Đã cọc' : item.status === 'pending' ? 'Giữ chỗ' : item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/orders/${item.id}/print`} className="size-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-colors" title="In phiếu">
                          <span className="material-symbols-outlined text-lg">print</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.code)}
                          className="size-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ManageOrders;