import React, { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { useBranding } from '../../../contexts/BrandingContext';

const SocialMediaAgent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [properties, setProperties] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    area: '',
    location: '',
    type: 'Căn hộ'
  });
  const { tenantId } = useBranding();

  // Sử dụng useCallback để hàm không bị khởi tạo lại vô ích
  const fetchSavedPosts = useCallback(async () => {
    if (!tenantId) return;
    try {
      const q = query(
        collection(db, 'social_posts'), 
        where('tenantId', '==', tenantId), 
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      setSavedPosts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [tenantId]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!tenantId) return;
      try {
        const q = query(
          collection(db, 'properties'), 
          where('tenantId', '==', tenantId), 
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        setProperties(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };

    fetchProperties();
    fetchSavedPosts();
  }, [tenantId, fetchSavedPosts]);

  const handleSelectProperty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const p = properties.find(item => item.id === selectedId);
    if (p) {
      setFormData({
        title: p.title || '',
        price: p.price || '',
        area: p.area || '',
        location: p.location || '',
        type: p.type || 'Căn hộ'
      });
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert("Vui lòng nhập tên dự án/BĐS");

    setLoading(true);
    try {
      const functions = getFunctions();
      const generateFn = httpsCallable(functions, 'generateSocialPost');
      const result = await generateFn(formData);
      setGeneratedContent((result.data as any).content);
    } catch (error: any) {
      console.error("AI Error:", error);
      alert("Lỗi khi gọi AI: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent || !tenantId) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'social_posts'), {
        ...formData,
        content: generatedContent,
        tenantId,
        createdAt: serverTimestamp(),
        platform: 'Facebook/Zalo'
      });
      alert("Đã lưu bài viết vào danh sách!");
      fetchSavedPosts();
    } catch (error: any) {
      console.error("Save error:", error);
      alert("Lỗi khi lưu: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await deleteDoc(doc(db, 'social_posts', id));
      setSavedPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const copyToClipboard = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    alert("Đã sao chép nội dung!");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-primary font-display tracking-tight uppercase">Social Media AI Agent</h2>
        <p className="text-sm text-slate-500 mt-1">Trợ lý viết bài quảng cáo Facebook & Zalo tự động</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft">
            <div className="mb-6 pb-6 border-b border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn từ danh sách BĐS có sẵn</label>
              <select
                onChange={handleSelectProperty}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none mt-2 cursor-pointer"
              >
                <option value="">-- Chọn bất động sản để điền nhanh --</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Dự án / BĐS</label>
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  placeholder="VD: Vinhomes Grand Park..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá bán</label>
                  <input
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    placeholder="VD: 5 Tỷ"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diện tích</label>
                  <input
                    value={formData.area}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    placeholder="VD: 80m2"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vị trí</label>
                <input
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  placeholder="VD: Quận 9, TP.HCM"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại hình</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                >
                  <option>Căn hộ</option>
                  <option>Nhà phố</option>
                  <option>Biệt thự</option>
                  <option>Đất nền</option>
                  <option>Shophouse</option>
                  <option>Officetel</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent-dark transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined">progress_activity</span>
                    ĐANG VIẾT BÀI...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">edit_square</span>
                    Tạo nội dung ngay
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Result Area */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-soft h-full flex flex-col overflow-hidden relative group min-h-[400px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">auto_awesome</span>
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Kết quả từ AI</span>
              </div>
              {generatedContent && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-[10px] font-bold text-white bg-primary hover:bg-primary-dark px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    {saving ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
                    Lưu lại
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="text-[10px] font-bold text-primary hover:bg-white px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-slate-200 shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    Sao chép
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-6 bg-slate-50/50 relative">
              {generatedContent ? (
                <textarea
                  readOnly
                  value={generatedContent}
                  className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-700 font-medium leading-relaxed resize-none text-base custom-scrollbar"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-6xl mb-4">post_add</span>
                  <p className="text-xs font-black uppercase tracking-widest">Chưa có nội dung</p>
                  <p className="text-[10px] mt-2 max-w-xs text-center">Nhập thông tin bên trái và nhấn nút tạo để AI viết bài quảng cáo cho bạn.</p>
                </div>
              )}
            </div>
          </div>

          {/* Saved Posts List */}
          {savedPosts.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-black text-primary font-display uppercase tracking-tight mb-4">Lịch sử bài viết đã lưu</h3>
              <div className="grid grid-cols-1 gap-4">
                {savedPosts.map((post) => (
                  <div key={post.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-primary">{post.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{post.location} • {post.price}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                      {post.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialMediaAgent;