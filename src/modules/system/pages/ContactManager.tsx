
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';

const ManageContact: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    email: 'partners@lucebiotech.com',
    phone: '1900 6868',
    address: 'Khu Công Nghệ Cao, Thủ Đức, TP. HCM',
    facebook: '',
    youtube: '',
    linkedin: '',

    zalo: '',
    copyright: '',
    disclaimer: ''
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const docRef = doc(db, 'settings', 'contact_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContactInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await setDoc(doc(db, 'settings', 'contact_info'), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      await createSystemLog('UPDATE', 'SETTING', `Cập nhật thông tin liên hệ và mạng xã hội hệ thống`, userProfile, 'low');
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (error) {
      console.error("Save failed", error);
      setMessage({ type: 'error', text: 'Không thể lưu thông tin. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">THÔNG TIN LIÊN HỆ & SOCIAL</h2>
        <p className="text-slate-500 font-medium">Quản lý thông tin hiển thị tại Footer và trang Liên hệ của website.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
          <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Phần 1: Thông tin liên lạc chính */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">contact_mail</span>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Thông tin liên lạc</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email liên hệ</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/10 text-sm font-bold text-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hotline / CSKH</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/10 text-sm font-bold text-primary transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ văn phòng / Lab</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/10 text-sm font-bold text-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Phần 2: Mạng xã hội */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">share</span>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Đường dẫn mạng xã hội (URL)</h3>
          </div>
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { id: 'facebook', label: 'Facebook URL', icon: 'facebook' },
              { id: 'youtube', label: 'YouTube URL', icon: 'video_library' },
              { id: 'linkedin', label: 'LinkedIn URL', icon: 'work' },
              { id: 'zalo', label: 'Zalo / Official Account', icon: 'chat' }
            ].map(social => (
              <div key={social.id} className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{social.label}</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-lg">{social.icon}</span>
                  <input
                    type="url"
                    value={(formData as any)[social.id]}
                    onChange={(e) => setFormData({ ...formData, [social.id]: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/10 text-sm font-bold text-primary transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phần 3: Cấu hình Footer */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">web_asset</span>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cấu hình Footer (Chân trang)</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Copyright Text</label>
              <input
                type="text"
                value={(formData as any).copyright || ''}
                onChange={(e) => setFormData({ ...formData, copyright: e.target.value } as any)}
                placeholder="VD: © 2026 LUCE LAND. BẢO LƯU MỌI QUYỀN."
                className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/10 text-sm font-bold text-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Disclaimer Text (Thông báo miễn trừ trách nhiệm)</label>
              <textarea
                value={(formData as any).disclaimer || ''}
                onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value } as any)}
                placeholder="VD: * Thông tin chỉ mang tính tham khảo..."
                className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/10 text-sm font-medium text-slate-600 h-24 resize-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-12 h-14 bg-primary text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.15em] shadow-2xl shadow-primary/20 flex items-center gap-3 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="animate-spin material-symbols-outlined text-xl">progress_activity</span>
                ĐANG LƯU...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">save</span>
                CẬP NHẬT THÔNG TIN
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageContact;
