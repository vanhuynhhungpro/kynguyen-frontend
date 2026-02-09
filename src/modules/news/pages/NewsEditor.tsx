
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { db, auth, storage } from '../../../firebase';
import { collection, doc, getDoc, setDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { createSystemLog } from '../../../services/Logger';
import { AiNewsAgent } from '../../../services/AiNewsAgent';

interface SEOFields {
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  featured_image_alt: string;
  seo_title: string;
  meta_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  category: string;
  tags: string[];
  status: 'published' | 'hidden';
}

const AddEditNews: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [imageAiLoading, setImageAiLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'seo'>('editor');

  const [dbCategories, setDbCategories] = useState<{ name: string, slug: string }[]>([]);
  const [dbTags, setDbTags] = useState<string[]>([]);

  const [tagInput, setTagInput] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);

  // AI Agent States
  const [aiBrief, setAiBrief] = useState('');
  const [aiGoal, setAiGoal] = useState('traffic');
  const [aiPersona, setAiPersona] = useState<'default' | 'spiritual'>('default');
  const [activeAiPrompt, setActiveAiPrompt] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [tempGeneratedImage, setTempGeneratedImage] = useState<string | null>(null);

  const [formData, setFormData] = useState<SEOFields>({
    title: '',
    slug: '',
    excerpt: '',
    content_html: '',
    featured_image_alt: '',
    seo_title: '',
    meta_description: '',
    primary_keyword: '',
    secondary_keywords: [],
    category: '',
    tags: [],
    status: 'published'
  });

  const [featuredImage, setFeaturedImage] = useState('');

  const fetchMasterData = async () => {
    try {
      const catSnap = await getDocs(collection(db, 'news_categories'));
      setDbCategories(catSnap.docs.map(doc => doc.data() as any));

      const tagSnap = await getDocs(collection(db, 'news_tags'));
      setDbTags(tagSnap.docs.map(doc => doc.data().name));
    } catch (e) {
      console.error("Lỗi tải master data:", e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchMasterData();

      if (isEdit && id) {
        try {
          const docRef = doc(db, 'news', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              ...formData,
              ...data,
              excerpt: data.excerpt || data.desc || '',
              content_html: data.content_html || data.content || '',
              secondary_keywords: data.secondary_keywords || [],
              status: data.status || 'published'
            } as SEOFields);
            if (data.img) setFeaturedImage(data.img);
            if (data.slug) setIsSlugManual(true);
          }
        } catch (error) {
          console.error("Lỗi tải bài viết:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEdit, id]);

  const createSlug = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (val: string) => {
    setFormData(prev => {
      const newData = { ...prev, title: val };
      if (!isSlugManual) {
        newData.slug = createSlug(val);
      }
      return newData;
    });
  };

  const handleSlugChange = (val: string) => {
    setFormData(prev => ({ ...prev, slug: val }));
    setIsSlugManual(!!val && val !== createSlug(formData.title));
  };

  const handleGenerateImagePrompt = async () => {
    if (!formData.title && !formData.content_html) {
      alert("Vui lòng nhập ít nhất tiêu đề để AI phân tích hình ảnh.");
      return;
    }

    setImageAiLoading(true);
    try {
      const prompt = await AiNewsAgent.generateImagePrompt(
        formData.title,
        formData.excerpt,
        formData.content_html
      );
      setImagePrompt(prompt);
    } catch (error) {
      console.error("Image Prompt AI Error:", error);
      alert("Lỗi khi tạo prompt hình ảnh. Vui lòng thử lại.");
    } finally {
      setImageAiLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    const promptToUse = imagePrompt || formData.title;
    if (!promptToUse) {
      alert("Vui lòng nhập tiêu đề bài viết hoặc tạo prompt trước.");
      return;
    }

    setGeneratingImage(true);
    setTempGeneratedImage(null);
    try {
      const imageBase64 = await AiNewsAgent.generateImage(promptToUse);
      setTempGeneratedImage(imageBase64);
    } catch (error: any) {
      console.error("Image Generation Error:", error);
      alert(`Lỗi khi vẽ ảnh bằng AI: ${error.message}`);
    } finally {
      setGeneratingImage(false);
    }
  };

  const confirmGeneratedImage = async () => {
    if (!tempGeneratedImage) return;

    setUploadingImage(true);
    try {
      const fileName = `news_covers/${Date.now()}_${formData.slug || 'article'}.png`;
      const storageRef = ref(storage, fileName);
      const uploadResult = await uploadString(storageRef, tempGeneratedImage, 'data_url');
      const downloadURL = await getDownloadURL(uploadResult.ref);

      setFeaturedImage(downloadURL);
      setTempGeneratedImage(null);
      alert("Đã xác nhận và tải ảnh lên hệ thống thành công!");
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      alert("Không thể tải ảnh lên server. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAIAgentCompose = async () => {
    if (!aiBrief.trim()) {
      alert("Vui lòng nhập ý tưởng hoặc đề cương bài viết.");
      return;
    }

    setAiLoading(true);
    setActiveAiPrompt('');

    try {
      // GỌI AGENT SERVICE MỚI
      const result = await AiNewsAgent.generateNewsContent(
        aiBrief,
        aiGoal,
        dbCategories.map(c => c.name),
        dbTags,
        aiPersona
      );

      setFormData(prev => ({
        ...prev,
        title: result.title,
        slug: result.slug,
        excerpt: result.excerpt,
        content_html: result.content_html,
        seo_title: result.seo_title,
        meta_description: result.meta_description,
        primary_keyword: result.primary_keyword,
        secondary_keywords: result.secondary_keywords,
        category: result.suggested_category || prev.category,
        tags: result.suggested_tags || []
      }));

      setActiveTab('editor');
      setIsSlugManual(true);
      alert("AI Agent đã tra cứu dữ liệu và soạn thảo bài viết xong!");

    } catch (error: any) {
      console.error("AI Agent Error:", error);
      alert("Đã có lỗi trong quá trình xử lý của AI. Lỗi: " + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content_html) {
      alert("Vui lòng điền tiêu đề và nội dung.");
      return;
    }

    setSaving(true);
    try {
      const finalSlug = formData.slug || createSlug(formData.title);
      const docId = isEdit ? id : finalSlug;

      const payload: any = {
        ...formData,
        img: featuredImage,
        tenantId: tenantId,
        date: new Date().toLocaleDateString('vi-VN'),
        updatedAt: serverTimestamp()
      };

      if (!isEdit) payload.createdAt = serverTimestamp();

      await setDoc(doc(db, 'news', docId), payload, { merge: true });

      // Ghi log Hệ thống
      const logAction = isEdit ? 'UPDATE' : 'CREATE';
      const logDetail = `${isEdit ? 'Cập nhật' : 'Đăng'} bài viết: ${formData.title}`;
      await createSystemLog(logAction, 'NEWS', logDetail, userProfile, 'medium');

      navigate('/manage-news');
    } catch (error: any) {
      console.error("Lưu bài viết thất bại:", error);
      alert("Lỗi lưu bài viết.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteThis = async () => {
    if (!id || !window.confirm(`Xóa vĩnh viễn bài viết: "${formData.title}"?`)) return;

    setSaving(true);
    try {
      const targetTitle = formData.title;
      const docRef = doc(db, 'news', id);
      await deleteDoc(docRef);

      // Ghi log Hệ thống
      await createSystemLog('DELETE', 'NEWS', `Xóa bài viết: ${targetTitle}`, userProfile, 'high');

      navigate('/manage-news');
    } catch (error) {
      console.error("Xóa thất bại:", error);
      alert("Không thể xóa bài viết.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate('/manage-news')} className="size-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary transition-all shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-2xl font-black text-primary font-display tracking-tight uppercase">{isEdit ? 'Cập nhật tin đăng' : 'Soạn thảo tin BĐS chuẩn SEO'}</h2>
            <p className="text-[10px] font-black text-accent uppercase tracking-widest">LUCE Real Estate AI Agent</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleSubmit} disabled={saving} className={`px-8 h-12 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${formData.status === 'published' ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-slate-700 text-white hover:bg-slate-800'}`}>
            {saving ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">{formData.status === 'published' ? 'done_all' : 'save'}</span>}
            {formData.status === 'published' ? 'Lưu & Xuất bản' : 'Lưu Bản Nháp'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">

          {/* AI WRITING AGENT PANEL */}
          <div className="bg-primary-dark text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group border border-accent/20">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[150px] filled-icon">psychology</span>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                  <span className="material-symbols-outlined text-2xl">magic_button</span>
                </div>
                <div>
                  <h3 className="text-lg font-black font-display uppercase tracking-tight">Chuyên gia AI Bất Động Sản</h3>
                  <p className="text-[10px] text-accent-light/50 font-black tracking-[0.2em]">PHÂN TÍCH & VIẾT BÀI TỰ ĐỘNG</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-accent-light/60 uppercase tracking-widest">Nhập ý tưởng hoặc dàn ý của bạn</label>
                  <textarea
                    value={aiBrief}
                    onChange={e => setAiBrief(e.target.value)}
                    className="w-full h-32 p-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-accent focus:bg-white/15 transition-all resize-none font-medium text-sm"
                    placeholder="Ví dụ: Phân tích tiềm năng tăng giá của bất động sản khu Đông TP.HCM trong năm 2024, tập trung vào hạ tầng giao thông..."
                  />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 bg-white/10 p-1 rounded-xl border border-white/10 w-full md:w-auto">
                    {[
                      { id: 'traffic', label: 'Tăng Traffic', icon: 'trending_up' },
                      { id: 'expert', label: 'Chuyên Gia', icon: 'verified' },
                      { id: 'sales', label: 'Chuyển Đổi', icon: 'shopping_cart' }
                    ].map(goal => (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setAiGoal(goal.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${aiGoal === goal.id ? 'bg-accent text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                      >
                        <span className="material-symbols-outlined text-sm">{goal.icon}</span>
                        {goal.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setAiPersona('default')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${aiPersona === 'default' ? 'bg-white text-primary shadow-lg' : 'text-white/60 hover:text-white'}`}
                      title="Phân tích thị trường, SEO, Chuyên nghiệp"
                    >
                      <span className="material-symbols-outlined text-sm">analytics</span>
                      Luce Analyst
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPersona('spiritual')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${aiPersona === 'spiritual' ? 'bg-[#8D6E63] text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                      title="Đọc vị vùng đất, Kể chuyện, Nhân văn"
                    >
                      <span className="material-symbols-outlined text-sm">temple_buddhist</span>
                      Linh Động Sản
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAIAgentCompose}
                    disabled={aiLoading}
                    className="w-full md:w-auto px-10 h-14 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-primary transition-all shadow-xl shadow-accent/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <span className="animate-spin material-symbols-outlined">progress_activity</span>
                        ĐANG SUY LUẬN...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">bolt</span>
                        Soạn thảo bài viết
                      </>
                    )}
                  </button>
                </div>

                {/* AREA HIỂN THỊ PROMPT ĐÃ TẠO */}
                {activeAiPrompt && (
                  <div className="mt-6 p-6 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">Log: Prompt AI đã gửi hệ thống</span>
                      <button onClick={() => setActiveAiPrompt('')} className="text-[9px] font-bold text-white/40 hover:text-white uppercase">Ẩn log</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar">
                      <pre className="text-[10px] text-accent-light/60 font-mono whitespace-pre-wrap leading-relaxed">
                        {activeAiPrompt}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/80 px-4">
              {['editor', 'preview', 'seo'].map(tab => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-5 text-[11px] font-black uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === tab ? 'text-primary border-primary bg-white' : 'text-slate-400 border-transparent hover:text-primary'}`}
                >
                  {tab === 'editor' ? 'Nội dung' : tab === 'preview' ? 'Xem trước' : 'Cấu hình SEO'}
                </button>
              ))}
            </div>

            <div className="p-10">
              {activeTab === 'editor' && (
                <div className="space-y-6">
                  <input
                    value={formData.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="w-full text-4xl font-black text-slate-900 border-none focus:ring-0 placeholder:text-slate-200 font-display"
                    placeholder="Tiêu đề bài viết..."
                  />
                  <div className="h-px bg-slate-100"></div>
                  <textarea
                    value={formData.content_html}
                    onChange={e => setFormData({ ...formData, content_html: e.target.value })}
                    className="w-full h-[600px] border-none focus:ring-0 text-slate-800 font-medium leading-relaxed resize-none custom-scrollbar text-lg"
                    placeholder="Nội dung bài viết (Markdown)..."
                  />
                </div>
              )}
              {activeTab === 'preview' && (
                <div className="prose prose-slate max-w-none lg:prose-xl prose-td:text-black prose-th:text-black animate-in fade-in duration-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formData.content_html}</ReactMarkdown>
                </div>
              )}
              {activeTab === 'seo' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid gap-8">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">SEO Title ({formData.seo_title.length}/60)</label>
                      <input
                        value={formData.seo_title}
                        onChange={e => setFormData({ ...formData, seo_title: e.target.value })}
                        className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold text-primary"
                        maxLength={60}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta Description ({formData.meta_description.length}/160)</label>
                      <textarea
                        value={formData.meta_description}
                        onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                        className="w-full h-28 p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium text-slate-600 resize-none"
                        maxLength={160}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Keyword chính</label>
                      <input
                        value={formData.primary_keyword}
                        onChange={e => setFormData({ ...formData, primary_keyword: e.target.value })}
                        className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold text-accent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-soft space-y-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">settings</span> Cấu hình hiển thị
            </h3>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái bài viết</label>
              <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                {[
                  { id: 'published', label: 'Công khai', icon: 'visibility' },
                  { id: 'hidden', label: 'Tạm ẩn', icon: 'visibility_off' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: s.id as any })}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${formData.status === s.id ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chuyên mục</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer"
              >
                <option value="">Chọn chuyên mục...</option>
                {dbCategories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tags bài viết</label>
              <div className="relative">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const clean = tagInput.trim().toUpperCase();
                      if (clean && !formData.tags.includes(clean)) {
                        setFormData({ ...formData, tags: [...formData.tags, clean] });
                        setTagInput('');
                      }
                    }
                  }}
                  placeholder="Gõ tag & Enter..."
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-primary uppercase focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg flex items-center gap-1 border border-slate-200">
                    #{tag}
                    <button type="button" onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}>
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slug URL</label>
              <input
                value={formData.slug}
                onChange={e => handleSlugChange(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ảnh bìa bài viết</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateImagePrompt}
                    disabled={imageAiLoading}
                    className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {imageAiLoading ? <span className="animate-spin material-symbols-outlined text-xs">progress_activity</span> : <span className="material-symbols-outlined text-xs">magic_button</span>}
                    Prompt AI
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={generatingImage}
                    className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {generatingImage ? <span className="animate-spin material-symbols-outlined text-xs">progress_activity</span> : <span className="material-symbols-outlined text-xs">brush</span>}
                    Vẽ ảnh AI
                  </button>
                </div>
              </div>

              {/* AREA HIỂN THỊ IMAGE PROMPT KHI ĐƯỢC TẠO XONG */}
              {(imagePrompt || imageAiLoading) && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    {imageAiLoading ? 'AI ĐANG SUY NGHĨ...' : 'PROMPT CHO AI VẼ ẢNH'}
                    {!imageAiLoading && <span className="material-symbols-outlined text-[10px] text-accent">check_circle</span>}
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    disabled={imageAiLoading}
                    className="w-full h-24 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-medium text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all resize-none outline-none custom-scrollbar"
                    placeholder="Nội dung prompt sẽ hiển thị ở đây sau khi bạn nhấn Prompt AI..."
                  />
                  {!imageAiLoading && <p className="text-[8px] text-slate-400 italic">Bạn có thể chỉnh sửa nội dung trên trước khi nhấn "Vẽ ảnh AI".</p>}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[9px] text-slate-400 font-bold uppercase">URL Ảnh Chính</p>
                <input
                  value={featuredImage}
                  onChange={e => setFeaturedImage(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  placeholder="Dán link ảnh hoặc để AI vẽ..."
                />
              </div>

              <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative group bg-slate-50 flex items-center justify-center">
                {generatingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="animate-spin material-symbols-outlined text-primary text-3xl">progress_activity</span>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">AI đang vẽ hình...</p>
                  </div>
                ) : (
                  <>
                    {featuredImage ? (
                      <img src={featuredImage} className="w-full h-full object-cover" alt="Cover Preview" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x450?text=No+Image'; }} />
                    ) : (
                      <div className="text-center p-6">
                        <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">image</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chưa có ảnh bài viết</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Ảnh bìa hiện tại</span>
                    </div>
                  </>
                )}
              </div>

              {tempGeneratedImage && (
                <div className="space-y-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Kết quả AI vừa vẽ</p>
                    <span className="px-2 py-0.5 bg-accent text-white text-[8px] font-black rounded uppercase">Mới</span>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-primary/20 relative">
                    <img src={tempGeneratedImage} className="w-full h-full object-cover" alt="Temp generated" />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                        <span className="animate-spin material-symbols-outlined text-primary text-2xl">progress_activity</span>
                        <p className="text-[8px] font-black text-primary uppercase mt-2">Đang tải lên Storage...</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => setTempGeneratedImage(null)}
                      className="h-10 rounded-lg bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={confirmGeneratedImage}
                      className="h-10 rounded-lg bg-accent text-white text-[10px] font-black uppercase shadow-md hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm">cloud_upload</span>
                      )}
                      Xác nhận dùng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isEdit && (
              <div className="pt-8 border-t border-slate-50">
                <button
                  type="button"
                  onClick={handleDeleteThis}
                  className="w-full h-12 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 rounded-xl transition-all border border-rose-100"
                >
                  XÓA BÀI VIẾT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditNews;
