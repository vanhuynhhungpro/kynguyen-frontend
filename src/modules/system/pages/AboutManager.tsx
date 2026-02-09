import React, { useState, useEffect } from 'react';
import { db, storage } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';
import { useBranding } from '../../../contexts/BrandingContext';

const ManageAbout: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    hero: {
      title: 'Hơn Cả Một Ngôi Nhà',
      subtitle: 'Là Phong Cách Sống',
      description: 'Tôi không chỉ môi giới bất động sản, tôi đồng hành cùng bạn kiến tạo di sản và gia tăng giá trị tài sản bền vững theo thời gian.',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2000&auto=format&fit=crop'
    },
    personal: {
      greeting: 'Xin chào, tôi là Trần Minh',
      role: 'Chuyên gia tư vấn Bất động sản Cao cấp',
      description: `Với hơn 10 năm hoạt động trong thị trường bất động sản hạng sang tại TP.HCM và các vùng lân cận, tôi đã vinh dự được hỗ trợ hơn 500 khách hàng tìm được không gian sống lý tưởng và các cơ hội đầu tư sinh lời vượt trội.\n\nTriết lý làm việc của tôi dựa trên sự Minh Bạch - Tận Tâm - Chuyên Nghiệp. Tôi tin rằng mỗi giao dịch không chỉ là mua bán, mà là sự khởi đầu cho một mối quan hệ hợp tác lâu dài. Tôi luôn đặt lợi ích của khách hàng lên hàng đầu, cung cấp những phân tích thị trường trung thực và giải pháp tài chính tối ưu nhất.\n\nDù bạn đang tìm kiếm một căn Penthouse đẳng cấp, một biệt thự nghỉ dưỡng hay một cơ hội đầu tư đất nền tiềm năng, tôi luôn sẵn sàng lắng nghe và đồng hành cùng bạn.`,
      imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop',
      yearsExperience: '10+',
      transactions: '500+',
      customers: '2000+',
      satisfaction: '98%'
    },
    cta: {
      title: 'Sẵn sàng cho hành trình đầu tư của bạn?',
      description: 'Hãy để tôi giúp bạn tìm kiếm ngôi nhà mơ ước hoặc cơ hội đầu tư sinh lời tốt nhất ngay hôm nay.'
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!tenantId) return;
      try {
        const docRef = doc(db, 'tenants', tenantId, 'settings', 'about');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Merge with default to ensure structure
          setFormData(prev => ({
            hero: { ...prev.hero, ...data.hero },
            personal: { ...prev.personal, ...data.personal },
            cta: { ...prev.cta, ...data.cta }
          }));
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'tenants', tenantId, 'settings', 'about'), {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.fullName || 'Admin'
      });
      await createSystemLog('UPDATE', 'SETTING', 'Cập nhật nội dung trang Giới thiệu', userProfile, 'medium');
      alert('Đã lưu thay đổi thành công!');
    } catch (error) {
      console.error("Save error:", error);
      alert('Lỗi khi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: 'hero' | 'personal' | 'cta', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: 'hero' | 'personal') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước ảnh quá lớn (tối đa 5MB)");
        return;
      }

      setUploading(true);
      try {
        const storageRef = ref(storage, `about/${section}_${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        updateField(section, 'imageUrl', url);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Lỗi tải ảnh lên");
      } finally {
        setUploading(false);
      }
    }
  };

  if (loading) return <div className="p-10 text-center"><span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">QUẢN LÝ TRANG GIỚI THIỆU</h2>
          <p className="text-slate-500 font-medium">Chỉnh sửa nội dung, hình ảnh và thông tin cá nhân trên trang About.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="h-12 px-8 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          {(saving || uploading) ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
          Lưu thay đổi
        </button>
      </div>

      <div className="space-y-10">
        {/* HERO SECTION */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">image</span>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Phần mở đầu (Hero Section)</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề chính</label>
                <input value={formData.hero.title} onChange={e => updateField('hero', 'title', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề phụ (Highlight)</label>
                <input value={formData.hero.subtitle} onChange={e => updateField('hero', 'subtitle', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-accent" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả ngắn</label>
              <textarea value={formData.hero.description} onChange={e => updateField('hero', 'description', e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border-none text-sm font-medium text-slate-600 h-24 resize-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hình nền (Hero Image)</label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {formData.hero.imageUrl && <img src={formData.hero.imageUrl} alt="Preview" className="h-24 w-40 object-cover rounded-lg border border-slate-200 shadow-sm" />}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'hero')}
                    disabled={uploading}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* Kích thước khuyên dùng: <strong>1920x1080px</strong> (Landscape). Dung lượng tối đa 5MB.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PERSONAL STORY */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person</span>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Câu chuyện cá nhân (Profile)</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lời chào</label>
                <input value={formData.personal.greeting} onChange={e => updateField('personal', 'greeting', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chức danh / Vai trò</label>
                <input value={formData.personal.role} onChange={e => updateField('personal', 'role', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-600" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung giới thiệu (Mỗi đoạn cách nhau 1 dòng)</label>
              <textarea value={formData.personal.description} onChange={e => updateField('personal', 'description', e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border-none text-sm font-medium text-slate-600 h-64 resize-none" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kinh nghiệm</label>
                <input value={formData.personal.yearsExperience} onChange={e => updateField('personal', 'yearsExperience', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-black text-primary text-center" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giao dịch</label>
                <input value={formData.personal.transactions} onChange={e => updateField('personal', 'transactions', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-black text-primary text-center" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khách hàng</label>
                <input value={formData.personal.customers} onChange={e => updateField('personal', 'customers', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-black text-primary text-center" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hài lòng</label>
                <input value={formData.personal.satisfaction} onChange={e => updateField('personal', 'satisfaction', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-black text-primary text-center" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ảnh chân dung</label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {formData.personal.imageUrl && <img src={formData.personal.imageUrl} alt="Portrait Preview" className="h-32 w-24 object-cover rounded-lg border border-slate-200 shadow-sm" />}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'personal')}
                    disabled={uploading}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* Kích thước khuyên dùng: <strong>800x1000px</strong> (Portrait 3:4). Dung lượng tối đa 5MB.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">call_to_action</span>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Kêu gọi hành động (CTA)</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề CTA</label>
              <input value={formData.cta.title} onChange={e => updateField('cta', 'title', e.target.value)} className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả CTA</label>
              <textarea value={formData.cta.description} onChange={e => updateField('cta', 'description', e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border-none text-sm font-medium text-slate-600 h-24 resize-none" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManageAbout;