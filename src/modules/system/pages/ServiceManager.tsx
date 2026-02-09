import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  period: string; // e.g., "Tháng", "Năm", "Lần"
  description: string;
  features: string[];
  isPopular: boolean;
}

const ServiceManager: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();
  const [services, setServices] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<ServicePackage>>({
    features: ['']
  });

  const fetchServices = async () => {
    if (!tenantId) return;
    try {
      const q = query(collection(db, 'services'), where('tenantId', '==', tenantId));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServicePackage[];
      setServices(list);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [tenantId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService.name || !currentService.price) return alert("Vui lòng nhập tên và giá");

    try {
      const data = {
        ...currentService,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.uid,
        tenantId: tenantId // Enforce tenant isolation
      };

      if (currentService.id) {
        await updateDoc(doc(db, 'services', currentService.id), data);
      } else {
        await addDoc(collection(db, 'services'), { ...data, createdAt: serverTimestamp() });
      }

      setIsEditing(false);
      setCurrentService({ features: [''] });
      fetchServices();
      alert("Đã lưu thành công!");
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Lỗi khi lưu dữ liệu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói dịch vụ này?")) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(currentService.features || [])];
    newFeatures[index] = value;
    setCurrentService({ ...currentService, features: newFeatures });
  };

  const addFeatureField = () => {
    setCurrentService({ ...currentService, features: [...(currentService.features || []), ''] });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">QUẢN LÝ GÓI DỊCH VỤ</h2>
          <p className="text-slate-500 font-medium">Cấu hình bảng giá và các gói sản phẩm hiển thị trên website.</p>
        </div>
        <button
          onClick={() => { setCurrentService({ features: [''] }); setIsEditing(true); }}
          className="h-12 px-6 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span> Thêm Gói Mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className={`relative bg-white rounded-[2.5rem] p-8 border ${service.isPopular ? 'border-accent shadow-xl shadow-accent/10' : 'border-slate-100 shadow-card'} group`}>
              {service.isPopular && (
                <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl rounded-tr-[2.3rem]">
                  Phổ biến nhất
                </div>
              )}
              <h3 className="text-xl font-black text-primary uppercase mb-2">{service.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black text-slate-800">{service.price}</span>
                <span className="text-sm font-bold text-slate-400">/{service.period}</span>
              </div>
              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{service.description}</p>
              <ul className="space-y-3 mb-8">
                {service.features?.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 mt-auto">
                <button onClick={() => { setCurrentService(service); setIsEditing(true); }} className="flex-1 h-10 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 transition-all">Sửa</button>
                <button onClick={() => handleDelete(service.id)} className="size-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-all"><span className="material-symbols-outlined">delete</span></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit/Add */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-primary font-display uppercase">{currentService.id ? 'Cập nhật gói' : 'Thêm gói mới'}</h3>
              <button onClick={() => setIsEditing(false)} className="size-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên gói</label>
                  <input required value={currentService.name || ''} onChange={e => setCurrentService({ ...currentService, name: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm" placeholder="VD: Gói Cơ Bản" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nổi bật</label>
                  <select value={currentService.isPopular ? 'true' : 'false'} onChange={e => setCurrentService({ ...currentService, isPopular: e.target.value === 'true' })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm">
                    <option value="false">Không</option>
                    <option value="true">Có (Gắn nhãn Popular)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá hiển thị</label>
                  <input required value={currentService.price || ''} onChange={e => setCurrentService({ ...currentService, price: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm" placeholder="VD: 5.000.000đ" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chu kỳ tính</label>
                  <input required value={currentService.period || ''} onChange={e => setCurrentService({ ...currentService, period: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm" placeholder="VD: Tháng, Năm, Dự án" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả ngắn</label>
                <textarea value={currentService.description || ''} onChange={e => setCurrentService({ ...currentService, description: e.target.value })} className="w-full h-24 p-4 rounded-xl bg-slate-50 border-none font-medium text-sm resize-none" placeholder="Mô tả ngắn gọn về gói dịch vụ..." />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh sách tính năng</label>
                {currentService.features?.map((feature, idx) => (
                  <input key={idx} value={feature} onChange={e => handleFeatureChange(idx, e.target.value)} className="w-full h-10 px-4 rounded-lg bg-slate-50 border-none text-sm font-medium mb-2" placeholder={`Tính năng ${idx + 1}`} />
                ))}
                <button type="button" onClick={addFeatureField} className="text-xs font-bold text-primary hover:underline">+ Thêm dòng tính năng</button>
              </div>
              <button type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 mt-4">Lưu Gói Dịch Vụ</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;