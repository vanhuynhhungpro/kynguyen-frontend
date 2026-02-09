import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';
import { LandingPage, LandingSection } from '../types/LandingPage';

// --- PREVIEW COMPONENT (Mini ProjectLanding) ---
const LandingPreview: React.FC<{ data: LandingPage; property: any }> = ({ data, property }) => {
  const themeColor = data.themeColor || '#0B3C49';
  const fontClass = data.fontFamily || 'font-sans';
  const overlayOpacity = data.heroOverlayOpacity ? data.heroOverlayOpacity / 100 : 0.6;

  return (
    <div className={`bg-white w-full h-full overflow-y-auto custom-scrollbar ${fontClass}`}>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={property.imageUrl} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }}></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <span className="inline-block px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg" style={{ backgroundColor: themeColor }}>
            {property.type} • {property.status}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
            {data.heroTitle || property.title}
          </h1>
          <p className="text-sm md:text-lg text-slate-200 font-medium max-w-2xl mx-auto mb-8">
            {data.heroSubtitle || property.location}
          </p>
          <button className="h-12 px-8 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-xl" style={{ backgroundColor: themeColor }}>
            {data.ctaText || 'Nhận báo giá'}
          </button>
        </div>
      </section>

      {/* Dynamic Sections */}
      {/* Dynamic Sections */}
      {data.sections?.map((section, idx) => {
        const isDark = idx % 2 === 0;
        const bgClass = isDark ? 'bg-slate-50' : 'bg-white';

        if (section.type === 'features') {
          return (
            <section key={idx} className={`py-16 px-8 ${bgClass}`}>
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h3 className="text-2xl font-black uppercase tracking-wide mb-2" style={{ color: themeColor }}>{section.title}</h3>
                  <p className="text-slate-500 max-w-2xl mx-auto">{section.content}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {section.features?.map((f, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                      <div className="size-12 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg" style={{ backgroundColor: themeColor }}>
                        <span className="material-symbols-outlined">{f.icon || 'star'}</span>
                      </div>
                      <h4 className="font-bold text-lg mb-2 text-slate-800">{f.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'contact') {
          return (
            <section key={idx} className={`py-16 px-8 ${bgClass}`}>
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-black uppercase tracking-wide mb-2" style={{ color: themeColor }}>{section.title}</h3>
                <p className="text-slate-500 mb-6">{section.content}</p>
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" style={{ color: themeColor }}></div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 flex items-center text-xs font-bold text-slate-400">Họ và tên</div>
                      <div className="h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 flex items-center text-xs font-bold text-slate-400">Số điện thoại</div>
                    </div>
                    <div className="h-12 rounded-xl bg-slate-50 border border-slate-100 px-4 flex items-center text-xs font-bold text-slate-400">Email</div>
                    <div className="h-12 rounded-xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center shadow-lg transform group-hover:scale-[1.02] transition-all" style={{ backgroundColor: themeColor }}>
                      Gửi yêu cầu
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'payment_schedule') {
          return (
            <section key={idx} className={`py-16 px-8 ${bgClass}`}>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-black uppercase tracking-wide mb-2" style={{ color: themeColor }}>{section.title}</h3>
                  <p className="text-slate-500">{section.content}</p>
                </div>
                <div className="space-y-4">
                  {section.paymentSchedule?.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="size-12 rounded-full flex items-center justify-center font-black text-white shrink-0" style={{ backgroundColor: themeColor }}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{item.stage}</h4>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-black text-emerald-600">{item.percentage}%</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{item.date || 'TBA'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'interior') {
          return (
            <section key={idx} className={`py-16 px-8 ${bgClass}`}>
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-black uppercase tracking-wide mb-2" style={{ color: themeColor }}>{section.title}</h3>
                  <p className="text-slate-500">{section.content}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {section.interiorImages?.map((img, i) => (
                    <div key={i} className={`relative group rounded-2xl overflow-hidden shadow-md ${i % 3 === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                      <img src={img.url} className="w-full h-full object-cover" alt={img.roomName} />
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-white font-bold text-sm">{img.roomName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'agent') {
          return (
            <section key={idx} className={`py-16 px-8 ${bgClass}`}>
              <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                <img src={section.agent?.avatarUrl || 'https://via.placeholder.com/150'} className="size-32 rounded-full object-cover border-4 border-slate-50 shadow-lg" alt="Agent" />
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl font-black mb-1" style={{ color: themeColor }}>{section.agent?.name || 'Tên tư vấn viên'}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{section.agent?.role || 'Chuyên viên tư vấn'}</p>
                  <p className="text-slate-600 mb-6 italic">"{section.content}"</p>
                  <div className="flex justify-center md:justify-start gap-3">
                    <button className="h-10 px-6 rounded-full text-white font-bold text-xs uppercase tracking-widest shadow-lg flex items-center gap-2" style={{ backgroundColor: themeColor }}>
                      <span className="material-symbols-outlined text-sm">call</span> {section.agent?.phone}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // Default: Content Section
        return (
          <section key={idx} className={`py-12 px-8 ${bgClass}`}>
            <div className={`flex flex-col gap-8 ${section.layout === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center`}>
              {section.imageUrl && (
                <div className="lg:w-1/2">
                  <img src={section.imageUrl} className="rounded-2xl shadow-lg w-full object-cover aspect-video" alt="" />
                </div>
              )}
              <div className={`space-y-4 ${section.imageUrl ? 'lg:w-1/2' : 'w-full text-center'}`}>
                <h3 className="text-3xl font-display font-bold leading-tight" style={{ color: themeColor }}>{section.title}</h3>
                <p className="text-slate-600 font-medium text-base leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            </div>
          </section>
        );
      })}

      {/* Policy Preview */}
      {data.policy && (
        <section className="py-12 px-8 text-white" style={{ backgroundColor: themeColor }}>
          <h3 className="text-xl font-black mb-4 text-center">CHÍNH SÁCH BÁN HÀNG</h3>
          <div className="bg-white/10 p-6 rounded-2xl text-sm whitespace-pre-wrap">{data.policy}</div>
        </section>
      )}
    </div>
  );
};

// --- MAIN BUILDER PAGE ---
const LandingPageBuilder: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'hero' | 'sections' | 'seo' | 'menu'>('general');

  // Landing Page State
  const [landingData, setLandingData] = useState<LandingPage>({
    propertyId: propertyId || '',
    slug: '',
    isActive: false,
    heroTitle: '',
    heroSubtitle: '',
    themeColor: '#0B3C49',
    fontFamily: 'font-sans',
    heroOverlayOpacity: 60,
    ctaText: 'Đăng ký tư vấn',
    videoUrl: '',
    locationMapUrl: '',
    policy: '',
    sections: [],
    createdAt: null,
    updatedAt: null
  });

  useEffect(() => {
    const initData = async () => {
      if (!propertyId) return;
      try {
        // 1. Fetch Property Info
        const propDoc = await getDoc(doc(db, 'properties', propertyId));
        if (!propDoc.exists()) {
          alert("Bất động sản không tồn tại!");
          navigate('/manage-properties');
          return;
        }
        setProperty({ id: propDoc.id, ...propDoc.data() });

        // 2. Fetch Existing Landing Page (if any)
        const q = query(collection(db, 'landing_pages'), where('propertyId', '==', propertyId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as LandingPage;
          setLandingData({ ...data, id: snapshot.docs[0].id });
        } else {
          // Init default from property
          setLandingData(prev => ({
            ...prev,
            slug: propDoc.data().slug || '',
            heroTitle: propDoc.data().title,
            heroSubtitle: propDoc.data().location
          }));
        }
      } catch (error) {
        console.error("Init error:", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [propertyId, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Helper to sanitize data (remove undefined or incorrect types)
      const sanitizeData = (obj: any): any => {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
          if (value === undefined) return null;
          return value;
        }));
      };

      const payload = sanitizeData({
        ...landingData,
        updatedAt: serverTimestamp()
      });

      if (landingData.id) {
        await setDoc(doc(db, 'landing_pages', landingData.id), payload, { merge: true });
      } else {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(collection(db, 'landing_pages')), payload);
      }

      // SYNC to Property (Critical for correctly displaying link in Manager)
      if (propertyId) {
        await updateDoc(doc(db, 'properties', propertyId), {
          landingConfig: {
            enabled: landingData.isActive,
            slug: landingData.slug || propertyId // Fallback to ID if no slug
          },
          slug: landingData.slug // Also update root slug if needed
        });
      }

      await createSystemLog('UPDATE', 'PROPERTY', `Cập nhật Landing Page cho BĐS: ${property.title}`, userProfile, 'medium');
      alert("Đã lưu Landing Page thành công!");
    } catch (error) {
      console.error("Save error:", error);
      alert(`Lỗi khi lưu dữ liệu. ${error}`);
    } finally {
      setSaving(false);
    }
  };

  // Section Helpers
  const addSection = (type: 'content' | 'features' | 'agent' | 'payment_schedule' | 'interior' | 'contact' = 'content') => {
    const newSection: LandingSection = {
      id: Date.now().toString(),
      type,
      layout: 'left',
      title: type === 'features' ? 'Tiện ích nổi bật' : type === 'agent' ? 'Chuyên gia tư vấn' : type === 'payment_schedule' ? 'Tiến độ thanh toán' : type === 'interior' ? 'Không gian sống' : type === 'contact' ? 'Đăng ký tư vấn' : 'Tiêu đề khối mới',
      content: type === 'contact' ? 'Để lại thông tin để nhận bảng giá ưu đãi...' : 'Mô tả ngắn gọn...',
      imageUrl: '',
      features: type === 'features' ? [
        { icon: 'park', title: 'Công viên cây xanh', description: 'Không gian xanh mát...' },
        { icon: 'pool', title: 'Hồ bơi tràn bờ', description: 'Thư giãn tuyệt đối...' },
        { icon: 'fitness_center', title: 'Phòng Gym', description: 'Trang thiết bị hiện đại...' }
      ] : [],
      agent: type === 'agent' ? { name: userProfile?.fullName || 'Nguyễn Văn A', role: 'Chuyên viên tư vấn', phone: '0909000000', email: 'contact@example.com', avatarUrl: '' } : undefined,
      paymentSchedule: type === 'payment_schedule' ? [
        { stage: 'Đợt 1', percentage: '15', description: 'Ký HĐMB', date: 'Tháng 12/2024' },
        { stage: 'Đợt 2', percentage: '10', description: 'Đổ bê tông sàn tầng 5', date: 'Tháng 02/2025' }
      ] : undefined,
      interiorImages: type === 'interior' ? [] : undefined
    };

    setLandingData(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSection]
    }));
  };

  const updateSection = (idx: number, field: keyof LandingSection, value: any) => {
    const newSections = [...(landingData.sections || [])];
    newSections[idx] = { ...newSections[idx], [field]: value };
    setLandingData(prev => ({ ...prev, sections: newSections }));
  };

  const removeSection = (idx: number) => {
    const newSections = [...(landingData.sections || [])];
    newSections.splice(idx, 1);
    setLandingData(prev => ({ ...prev, sections: newSections }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const storageRef = ref(storage, `landing_pages/${propertyId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        updateSection(idx, 'imageUrl', url);
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span></div>;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* LEFT PANEL: EDITOR */}
      <div className="w-[450px] bg-white border-r border-slate-200 flex flex-col h-full shadow-xl z-10">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-black text-primary font-display uppercase tracking-tight">Landing Builder</h2>
            <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">{property.title}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/manage-properties')} className="size-9 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500"><span className="material-symbols-outlined">close</span></button>
            <button onClick={handleSave} disabled={saving} className="h-9 px-4 bg-primary text-white rounded-lg font-bold text-xs hover:bg-primary-dark transition-all flex items-center gap-2">
              {saving ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
              Lưu
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[
            { id: 'general', icon: 'settings', label: 'Chung' },
            { id: 'hero', icon: 'image', label: 'Hero' },
            { id: 'sections', icon: 'view_agenda', label: 'Khối' },
            { id: 'menu', icon: 'menu', label: 'Menu' },
            { id: 'seo', icon: 'search', label: 'SEO' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Trạng thái trang</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={landingData.isActive} onChange={e => setLandingData({ ...landingData, isActive: e.target.checked })} />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Màu chủ đạo (Theme)</label>
                <div className="flex gap-2 mt-1">
                  <input type="color" value={landingData.themeColor} onChange={e => setLandingData({ ...landingData, themeColor: e.target.value })} className="h-10 w-14 rounded cursor-pointer border-none p-0" />
                  <input type="text" value={landingData.themeColor} onChange={e => setLandingData({ ...landingData, themeColor: e.target.value })} className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Font chữ</label>
                <select value={landingData.fontFamily} onChange={e => setLandingData({ ...landingData, fontFamily: e.target.value as any })} className="w-full h-10 mt-1 px-3 rounded-lg border border-slate-200 text-sm">
                  <option value="font-sans">Inter (Hiện đại - Default)</option>
                  <option value="font-serif">Merriweather (Sang trọng)</option>
                  <option value="font-mono">Roboto Mono (Kỹ thuật)</option>
                  <option value="font-display">Playfair Display (Cao cấp)</option>
                  <option value="font-body">Roboto Slab (Mạnh mẽ)</option>
                  <option value="font-hand">Dancing Script (Sáng tạo)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nút CTA (Kêu gọi)</label>
                <input value={landingData.ctaText} onChange={e => setLandingData({ ...landingData, ctaText: e.target.value })} className="w-full h-10 mt-1 px-3 rounded-lg border border-slate-200 text-sm font-bold" placeholder="Đăng ký ngay" />
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề lớn (H1)</label>
                <textarea value={landingData.heroTitle} onChange={e => setLandingData({ ...landingData, heroTitle: e.target.value })} className="w-full p-3 mt-1 rounded-lg border border-slate-200 text-sm font-bold h-20 resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả phụ (Subtitle)</label>
                <textarea value={landingData.heroSubtitle} onChange={e => setLandingData({ ...landingData, heroSubtitle: e.target.value })} className="w-full p-3 mt-1 rounded-lg border border-slate-200 text-sm h-20 resize-none" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ mờ nền (Overlay)</label>
                  <span className="text-xs font-bold text-primary">{landingData.heroOverlayOpacity}%</span>
                </div>
                <input type="range" min="0" max="90" value={landingData.heroOverlayOpacity} onChange={e => setLandingData({ ...landingData, heroOverlayOpacity: parseInt(e.target.value) })} className="w-full mt-2 accent-primary" />
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <button onClick={() => addSection('content')} className="h-10 border border-slate-200 bg-white hover:border-primary hover:text-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">article</span> Nội dung
                </button>
                <button onClick={() => addSection('features')} className="h-10 border border-slate-200 bg-white hover:border-primary hover:text-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">grid_view</span> Tiện ích
                </button>
                <button onClick={() => addSection('agent')} className="h-10 border border-slate-200 bg-white hover:border-primary hover:text-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">person</span> Tư vấn
                </button>
                <button onClick={() => addSection('payment_schedule')} className="h-10 border border-slate-200 bg-white hover:border-primary hover:text-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">payments</span> Tiến độ
                </button>
                <button onClick={() => addSection('interior')} className="h-10 border border-slate-200 bg-white hover:border-primary hover:text-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">chair</span> Nội thất
                </button>
                <button onClick={() => addSection('contact')} className="h-10 border border-slate-200 bg-white hover:border-primary hover:text-primary rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">contact_mail</span> Form LH
                </button>
              </div>

              <div className="space-y-4">
                {landingData.sections?.map((section, idx) => (
                  <div key={section.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative group animate-in slide-in-from-bottom-2">
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button onClick={() => removeSection(idx)} className="size-6 bg-slate-100 text-slate-400 hover:text-rose-500 rounded flex items-center justify-center"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${section.type === 'content' ? 'bg-blue-50 text-blue-600' :
                        section.type === 'features' ? 'bg-purple-50 text-purple-600' :
                          section.type === 'agent' ? 'bg-emerald-50 text-emerald-600' :
                            section.type === 'payment_schedule' ? 'bg-amber-50 text-amber-600' :
                              section.type === 'contact' ? 'bg-indigo-50 text-indigo-600' :
                                'bg-rose-50 text-rose-600'
                        }`}>
                        {section.type === 'payment_schedule' ? 'Tiến độ TT' : section.type === 'interior' ? 'Nội thất' : section.type === 'contact' ? 'Form LH' : section.type === 'content' ? 'Nội dung' : section.type === 'features' ? 'Tiện ích' : 'Agent'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Tiêu đề khối</label>
                        <input value={section.title} onChange={e => updateSection(idx, 'title', e.target.value)} className="w-full h-8 px-2 rounded border border-slate-200 text-xs font-bold focus:border-primary outline-none" placeholder="Nhập tiêu đề..." />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Mô tả ngắn</label>
                        <textarea value={section.content} onChange={e => updateSection(idx, 'content', e.target.value)} className="w-full h-16 p-2 rounded border border-slate-200 text-xs focus:border-primary outline-none resize-none" placeholder="Nhập mô tả ngắn..." />
                      </div>

                      {(!section.type || section.type === 'content') && (
                        <>
                          <div className="flex gap-2">
                            <div className="w-full">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Bố cục</label>
                              <select value={section.layout} onChange={e => updateSection(idx, 'layout', e.target.value)} className="w-full h-8 px-1 rounded border border-slate-200 text-xs">
                                <option value="left">Ảnh Trái</option>
                                <option value="right">Ảnh Phải</option>
                                <option value="center">Giữa (Không ảnh)</option>
                              </select>
                            </div>
                            <div className="w-full">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Hình ảnh</label>
                              <div className="flex items-center gap-2 mt-1">
                                {section.imageUrl && <img src={section.imageUrl} className="size-6 rounded object-cover border border-slate-200" alt="" />}
                                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-[10px] font-bold text-slate-600">
                                  Chọn ảnh
                                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, idx)} />
                                </label>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Nội dung chi tiết</label>
                            <textarea value={section.content} onChange={e => updateSection(idx, 'content', e.target.value)} className="w-full p-2 rounded border border-slate-200 text-xs h-20 resize-none focus:border-primary outline-none" />
                          </div>
                        </>
                      )}

                      {section.type === 'features' && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Danh sách tiện ích (Features)</label>
                          {section.features?.map((feat, fIdx) => (
                            <div key={fIdx} className="flex gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                              <div className="w-10 pt-1">
                                <input value={feat.icon} onChange={e => {
                                  const newFeats = [...(section.features || [])];
                                  newFeats[fIdx].icon = e.target.value;
                                  updateSection(idx, 'features', newFeats);
                                }} className="w-full h-6 text-center text-[10px] border border-slate-200 rounded" placeholder="icon" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <input value={feat.title} onChange={e => {
                                  const newFeats = [...(section.features || [])];
                                  newFeats[fIdx].title = e.target.value;
                                  updateSection(idx, 'features', newFeats);
                                }} className="w-full h-6 px-2 text-[10px] font-bold border border-slate-200 rounded" placeholder="Tiêu đề (VD: Hồ bơi)" />
                                <input value={feat.description} onChange={e => {
                                  const newFeats = [...(section.features || [])];
                                  newFeats[fIdx].description = e.target.value;
                                  updateSection(idx, 'features', newFeats);
                                }} className="w-full h-6 px-2 text-[10px] border border-slate-200 rounded" placeholder="Mô tả ngắn..." />
                              </div>
                              <button onClick={() => {
                                const newFeats = [...(section.features || [])];
                                newFeats.splice(fIdx, 1);
                                updateSection(idx, 'features', newFeats);
                              }} className="text-slate-400 hover:text-rose-500"><span className="material-symbols-outlined text-sm">close</span></button>
                            </div>
                          ))}
                          <button onClick={() => {
                            const newFeats = [...(section.features || [])];
                            newFeats.push({ icon: 'star', title: 'Tiện ích mới', description: 'Mô tả...' });
                            updateSection(idx, 'features', newFeats);
                          }} className="w-full h-8 border border-dashed border-slate-300 rounded text-slate-500 text-[10px] hover:bg-slate-50">+ Thêm tiện ích</button>
                        </div>
                      )}

                      {section.type === 'payment_schedule' && (
                        <div className="space-y-2">
                          {section.paymentSchedule?.map((item, i) => (
                            <div key={i} className="flex gap-2 p-2 bg-slate-50 border border-slate-100 rounded">
                              <div className="space-y-1 flex-1">
                                <div className="flex gap-2">
                                  <input value={item.stage} onChange={e => {
                                    const newData = [...(section.paymentSchedule || [])];
                                    newData[i].stage = e.target.value;
                                    updateSection(idx, 'paymentSchedule', newData);
                                  }} className="flex-1 h-6 px-2 text-[10px] font-bold border border-slate-200 rounded" placeholder="Đợt..." />
                                  <input value={item.percentage} onChange={e => {
                                    const newData = [...(section.paymentSchedule || [])];
                                    newData[i].percentage = e.target.value;
                                    updateSection(idx, 'paymentSchedule', newData);
                                  }} className="w-16 h-6 px-2 text-[10px] font-bold border border-slate-200 rounded text-center" placeholder="%" />
                                </div>
                                <div className="flex gap-2">
                                  <input value={item.description} onChange={e => {
                                    const newData = [...(section.paymentSchedule || [])];
                                    newData[i].description = e.target.value;
                                    updateSection(idx, 'paymentSchedule', newData);
                                  }} className="flex-1 h-6 px-2 text-[10px] border border-slate-200 rounded" placeholder="Mô tả" />
                                  <input value={item.date} onChange={e => {
                                    const newData = [...(section.paymentSchedule || [])];
                                    newData[i].date = e.target.value;
                                    updateSection(idx, 'paymentSchedule', newData);
                                  }} className="w-24 h-6 px-2 text-[10px] border border-slate-200 rounded text-center" placeholder="Thời gian (VD: 12/2024)" />
                                </div>
                              </div>
                              <button onClick={() => {
                                const newData = [...(section.paymentSchedule || [])];
                                newData.splice(i, 1);
                                updateSection(idx, 'paymentSchedule', newData);
                              }} className="text-slate-400 hover:text-rose-500"><span className="material-symbols-outlined text-sm">close</span></button>
                            </div>
                          ))}
                          <button onClick={() => {
                            const newData = [...(section.paymentSchedule || [])];
                            newData.push({ stage: 'Đợt mới', percentage: '10', description: '', date: '' });
                            updateSection(idx, 'paymentSchedule', newData);
                          }} className="w-full h-8 border border-dashed border-slate-300 rounded text-[10px] text-slate-500 hover:bg-slate-50">+ Thêm đợt thanh toán</button>
                        </div>
                      )}

                      {section.type === 'interior' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {section.interiorImages?.map((img, i) => (
                              <div key={i} className="relative aspect-video rounded-lg overflow-hidden group">
                                <img src={img.url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 p-2 flex flex-col justify-end">
                                  <input value={img.roomName} onChange={e => {
                                    const newData = [...(section.interiorImages || [])];
                                    newData[i].roomName = e.target.value;
                                    updateSection(idx, 'interiorImages', newData);
                                  }} className="w-full bg-transparent text-white text-[10px] font-bold border-b border-white/50 outline-none pb-1" placeholder="Tên phòng" />
                                </div>
                                <button onClick={() => {
                                  const newData = [...(section.interiorImages || [])];
                                  newData.splice(i, 1);
                                  updateSection(idx, 'interiorImages', newData);
                                }} className="absolute top-1 right-1 text-white bg-black/50 rounded-full p-1"><span className="material-symbols-outlined text-[10px]">close</span></button>
                              </div>
                            ))}
                          </div>
                          <label className="block w-full h-10 border border-dashed border-slate-300 rounded flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50">
                            <span className="material-symbols-outlined text-sm text-slate-400">add_photo_alternate</span>
                            <span className="text-[10px] font-bold text-slate-500">Thêm ảnh nội thất</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={async (e) => {
                              if (e.target.files) {
                                // Simplified upload logic for multiple files
                                const newImages = [...(section.interiorImages || [])];
                                for (let j = 0; j < e.target.files.length; j++) {
                                  const file = e.target.files[j];
                                  const storageRef = ref(storage, `properties/interior/${Date.now()}_${file.name}`);
                                  const snapshot = await uploadBytes(storageRef, file);
                                  const url = await getDownloadURL(snapshot.ref);
                                  newImages.push({ url, roomName: 'Phòng mẫu' });
                                }
                                updateSection(idx, 'interiorImages', newImages);
                              }
                            }} />
                          </label>
                        </div>
                      )}

                      {section.type === 'agent' && (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin chuyên viên</p>
                          <div className="flex gap-4">
                            <label className="cursor-pointer group relative">
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const storageRef = ref(storage, `properties/agents/${Date.now()}_${file.name}`);
                                  const snapshot = await uploadBytes(storageRef, file);
                                  const url = await getDownloadURL(snapshot.ref);
                                  updateSection(idx, 'agent', { ...section.agent, avatarUrl: url });
                                }
                              }} />
                              <div className="size-20 bg-white rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-primary transition-colors">
                                {section.agent?.avatarUrl ?
                                  <img src={section.agent.avatarUrl} className="w-full h-full object-cover" /> :
                                  <div className="flex flex-col items-center">
                                    <span className="material-symbols-outlined text-slate-300 text-2xl group-hover:text-primary">add_a_photo</span>
                                  </div>
                                }
                              </div>
                              <div className="absolute -bottom-1 -right-1 size-6 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-[12px] text-slate-500">edit</span>
                              </div>
                            </label>

                            <div className="flex-1 space-y-2">
                              <div>
                                <input value={section.agent?.name} onChange={e => updateSection(idx, 'agent', { ...section.agent, name: e.target.value })} className="w-full h-9 px-3 text-sm font-bold border border-slate-200 rounded-lg focus:border-primary outline-none" placeholder="Tên hiển thị" />
                              </div>
                              <div>
                                <input value={section.agent?.role} onChange={e => updateSection(idx, 'agent', { ...section.agent, role: e.target.value })} className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:border-primary outline-none" placeholder="Chức vụ (VD: Senior Consultant)" />
                              </div>
                              <div className="flex flex-col gap-2">
                                <input value={section.agent?.phone} onChange={e => updateSection(idx, 'agent', { ...section.agent, phone: e.target.value })} className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:border-primary outline-none" placeholder="Số điện thoại" />
                                <input value={section.agent?.email} onChange={e => updateSection(idx, 'agent', { ...section.agent, email: e.target.value })} className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg focus:border-primary outline-none" placeholder="Email" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <textarea value={section.content} onChange={e => updateSection(idx, 'content', e.target.value)} className="w-full p-3 h-20 text-xs border border-slate-200 rounded-lg resize-none focus:border-primary outline-none" placeholder="Lời giới thiệu / Quote..." />
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chính sách bán hàng</label>
                <textarea value={landingData.policy} onChange={e => setLandingData({ ...landingData, policy: e.target.value })} className="w-full p-3 mt-1 rounded-lg border border-slate-200 text-sm h-32 resize-none" placeholder="Nhập chính sách..." />
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menu Điều Hướng</label>
                  <button onClick={() => setLandingData(prev => ({ ...prev, menu: [...(prev.menu || []), { label: 'Link Mới', sectionId: '' }] }))} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-sm">add</span> Thêm Link
                  </button>
                </div>

                <div className="space-y-3">
                  {(landingData.menu || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 items-start">
                      <div className="flex-1 space-y-2">
                        <input value={item.label} onChange={e => {
                          const newMenu = [...(landingData.menu || [])];
                          newMenu[idx].label = e.target.value;
                          setLandingData({ ...landingData, menu: newMenu });
                        }} className="w-full h-8 px-2 text-xs font-bold border border-slate-200 rounded outline-none focus:border-primary" placeholder="Tên hiển thị (VD: Vị trí)" />

                        <select value={item.sectionId} onChange={e => {
                          const newMenu = [...(landingData.menu || [])];
                          newMenu[idx].sectionId = e.target.value;
                          setLandingData({ ...landingData, menu: newMenu });
                        }} className="w-full h-8 px-2 text-xs border border-slate-200 rounded outline-none focus:border-primary">
                          <option value="">-- Chọn Section --</option>
                          <option value="overview">Tổng quan (Mặc định)</option>
                          <option value="location">Vị trí (Mặc định)</option>
                          <option value="gallery">Thư viện (Mặc định)</option>
                          <option value="floorplan">Mặt bằng (Mặc định)</option>
                          <option value="policy">Chính sách (Mặc định)</option>
                          {landingData.sections?.map((sec, i) => (
                            <option key={i} value={sec.id}>{sec.title} ({sec.type})</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={() => {
                        const newMenu = [...(landingData.menu || [])];
                        newMenu.splice(idx, 1);
                        setLandingData({ ...landingData, menu: newMenu });
                      }} className="size-8 flex items-center justify-center text-slate-400 hover:text-rose-500 rounded hover:bg-white"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  ))}
                  {(!landingData.menu || landingData.menu.length === 0) && (
                    <p className="text-center text-xs text-slate-400 italic py-4">Chưa có menu nào. Nhấn "Thêm Link" để tạo menu điều hướng.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đường dẫn (Slug)</label>
                <div className="flex items-center mt-1">
                  <span className="bg-slate-100 text-slate-500 text-xs px-3 py-2.5 rounded-l-lg border border-r-0 border-slate-200">/du-an/</span>
                  <input value={landingData.slug} onChange={e => setLandingData({ ...landingData, slug: e.target.value })} className="flex-1 h-10 px-3 rounded-r-lg border border-slate-200 text-sm font-mono text-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Maps Embed URL</label>
                <input value={landingData.locationMapUrl} onChange={e => setLandingData({ ...landingData, locationMapUrl: e.target.value })} className="w-full h-10 mt-1 px-3 rounded-lg border border-slate-200 text-xs" placeholder="<iframe>..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Youtube Video URL</label>
                <input value={landingData.videoUrl} onChange={e => setLandingData({ ...landingData, videoUrl: e.target.value })} className="w-full h-10 mt-1 px-3 rounded-lg border border-slate-200 text-xs" placeholder="https://youtube.com/..." />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: PREVIEW */}
      <div className="flex-1 bg-slate-200 p-8 flex flex-col items-center justify-center relative">
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-slate-500 shadow-sm">
          Live Preview
        </div>
        <div className="w-full max-w-[1200px] h-full bg-white rounded-xl shadow-2xl overflow-hidden border-[8px] border-slate-800 relative">
          {/* Mock Browser Header */}
          <div className="h-8 bg-slate-800 flex items-center px-4 gap-2">
            <div className="size-2.5 rounded-full bg-red-500"></div>
            <div className="size-2.5 rounded-full bg-amber-500"></div>
            <div className="size-2.5 rounded-full bg-emerald-500"></div>
            <div className="flex-1 text-center flex items-center justify-center gap-2">
              <div className="bg-slate-700 h-5 px-3 rounded text-[10px] text-slate-400 flex items-center justify-center font-mono">
                luceland.vn/du-an/{landingData.slug || propertyId}
              </div>
              {landingData.slug && (
                <a href={`#/du-an/${landingData.slug}`} target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 hover:text-white flex items-center gap-1 hover:underline">
                  <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                  Mở
                </a>
              )}
            </div>
          </div>
          <LandingPreview data={landingData} property={property} />
        </div>
      </div>
    </div>
  );
};

export default LandingPageBuilder;