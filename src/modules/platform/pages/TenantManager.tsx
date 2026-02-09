import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';

interface Tenant {
  id: string;
  name: string;
  code: string; // Unique identifier for the tenant (e.g., 'luce', 'dtk')
  domain?: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'basic' | 'pro' | 'enterprise';
  contactEmail: string;
  contactPhone?: string;
  createdAt: any;
}

const TenantManager: React.FC = () => {
  const { userProfile } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    code: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'basic' as 'basic' | 'pro' | 'enterprise'
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Fetch tenants
    const q = query(collection(db, 'tenants'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'active'
      })) as Tenant[];
      setTenants(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tenants:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await setDoc(doc(db, 'tenants', id), { status: newStatus }, { merge: true });
      await createSystemLog('UPDATE', 'SETTING', `Đổi trạng thái Tenant ${id} thành ${newStatus}`, userProfile, 'high');
      // Optimistic update
      setTenants(tenants.map(t => t.id === id ? { ...t, status: newStatus as any } : t));
    } catch (error: any) {
      console.error("Error toggling status:", error);
      alert("Lỗi: " + error.message);
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.code || !newTenant.name) return alert("Vui lòng nhập Tên và Mã Tenant");

    setActionLoading(true);
    try {
      // Use the code as the document ID for easier reference
      const tenantId = newTenant.code.toLowerCase().replace(/\s+/g, '-');

      await setDoc(doc(db, 'tenants', tenantId), {
        ...newTenant,
        id: tenantId,
        status: 'active',
        createdAt: serverTimestamp()
      });

      await createSystemLog('CREATE', 'SETTING', `Tạo mới Tenant: ${newTenant.name} (${tenantId})`, userProfile, 'high');

      setShowAddModal(false);
      setNewTenant({ name: '', code: '', domain: '', contactEmail: '', contactPhone: '', plan: 'basic' });
      alert("Đã tạo Tenant thành công!");
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      alert("Lỗi: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Tenant "${name}"? Hành động này cực kỳ nguy hiểm và có thể làm mất dữ liệu liên quan.`)) return;

    try {
      await deleteDoc(doc(db, 'tenants', id));
      await createSystemLog('DELETE', 'SETTING', `Xóa Tenant: ${name} (${id})`, userProfile, 'high');
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      alert("Lỗi: " + error.message);
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tenants, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">QUẢN LÝ TENANT (KHÁCH HÀNG)</h2>
          <p className="text-slate-500 font-medium">Danh sách các đơn vị đang thuê/sử dụng hệ thống Platform.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="h-12 px-6 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2">
          <span className="material-symbols-outlined">add_business</span>
          Thêm Tenant Mới
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên, mã, email..."
            className="w-full h-12 pl-12 pr-5 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm font-medium outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Tenant Info</th>
                <th className="px-6 py-5">Liên hệ</th>
                <th className="px-6 py-5">Gói dịch vụ</th>
                <th className="px-6 py-5">Trạng thái</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center italic text-slate-400">Đang tải dữ liệu...</td></tr>
              ) : filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-bold text-primary text-base">{tenant.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-1">ID: {tenant.id}</p>
                        {tenant.domain && <p className="text-xs text-blue-500 mt-0.5">{tenant.domain}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-slate-700">{tenant.contactEmail}</p>
                      <p className="text-xs text-slate-400">{tenant.contactPhone || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${tenant.plan === 'enterprise' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        tenant.plan === 'pro' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <button
                        onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                        className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${tenant.status === 'active'
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                          : 'text-rose-500 bg-rose-50 border-rose-100 hover:bg-rose-100'
                          }`}
                        title="Click để đổi trạng thái"
                      >
                        <span className={`size-2 rounded-full ${tenant.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {tenant.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                        className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all ml-auto"
                        title="Xóa Tenant"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-20 text-center italic text-slate-400">Chưa có dữ liệu Tenant.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-primary font-display uppercase tracking-tight">Thêm Tenant Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="size-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleAddTenant} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Doanh Nghiệp / Khách Hàng *</label>
                <input required value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-slate-900" placeholder="VD: Công ty BĐS ABC" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã Tenant (ID) *</label>
                  <input required value={newTenant.code} onChange={e => setNewTenant({ ...newTenant, code: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-slate-900" placeholder="VD: abc-land" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gói dịch vụ</label>
                  <select value={newTenant.plan} onChange={e => setNewTenant({ ...newTenant, plan: e.target.value as any })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-900">
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email liên hệ *</label>
                <input required type="email" value={newTenant.contactEmail} onChange={e => setNewTenant({ ...newTenant, contactEmail: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-slate-900" placeholder="admin@abc.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domain (Tùy chọn)</label>
                <input value={newTenant.domain} onChange={e => setNewTenant({ ...newTenant, domain: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-slate-900" placeholder="abc-land.com" />
              </div>

              <button disabled={actionLoading} type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 mt-4">
                {actionLoading ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : <span className="material-symbols-outlined">save</span>}
                Lưu Tenant
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManager;