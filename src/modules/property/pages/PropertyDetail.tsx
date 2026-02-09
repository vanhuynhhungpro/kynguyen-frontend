import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAnalytics } from '../../../hooks/useAnalytics';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  useAnalytics('properties', id); // Auto track view
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mortgage Calculator State
  const [loanAmount, setLoanAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(8.5); // % per year
  const [loanTerm, setLoanTerm] = useState(20); // years

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'video'>('overview');

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProperty({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
    window.scrollTo(0, 0);
  }, [id]);

  // Auto-fill loan amount based on property price
  useEffect(() => {
    if (property?.price) {
      const priceStr = property.price.toLowerCase();
      // Simple parser: remove non-digits, check for unit
      const num = parseFloat(priceStr.replace(/,/g, '.').replace(/[^0-9.]/g, ''));

      if (!isNaN(num)) {
        let total = 0;
        if (priceStr.includes('tỷ') || priceStr.includes('ty')) total = num * 1000000000;
        else if (priceStr.includes('triệu') || priceStr.includes('tr')) total = num * 1000000;

        if (total > 0) setLoanAmount(total * 0.7); // Default 70% loan
      }
    }
  }, [property]);

  const monthlyPayment = useMemo(() => {
    if (!loanAmount || !interestRate || !loanTerm) return 0;
    const r = interestRate / 100 / 12;
    const n = loanTerm * 12;
    return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [loanAmount, interestRate, loanTerm]);

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;
  if (!property) return <div className="h-screen flex items-center justify-center text-slate-400">Không tìm thấy bất động sản này.</div>;

  return (
    <div className="bg-white min-h-screen font-body pb-20">
      <div className="h-[50vh] relative overflow-hidden">
        <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            <span className="bg-accent text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest mb-4 inline-block">{property.type}</span>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2">{property.title}</h1>
            <p className="text-white/80 text-lg flex items-center gap-2"><span className="material-symbols-outlined">location_on</span> {property.location}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Header Cards (Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Giá bán</p>
            <p className="text-3xl lg:text-4xl font-black text-primary tracking-tight">{property.price}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500 delay-100">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Diện tích</p>
            <p className="text-3xl lg:text-4xl font-black text-primary tracking-tight">{property.area}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col justify-center gap-3 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <Link to="/contact" className="w-full h-12 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined">call</span> Liên hệ ngay
            </Link>
            {property.slug && (
              <Link to={`/project/${property.slug}`} className="w-full h-12 bg-slate-50 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                <span className="material-symbols-outlined">web</span> Landing Page
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-10">

            {/* Bento Grid Gallery - "Professional" Look */}
            {property.gallery && property.gallery.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-primary font-display flex items-center gap-2">
                  <span className="material-symbols-outlined">photo_library</span>
                  Thư viện hình ảnh
                </h3>
                <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[400px]">
                  {property.gallery.slice(0, 5).map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className={`relative rounded-xl overflow-hidden cursor-pointer group shadow-sm ${idx === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
                        }`}
                    >
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                  ))}
                  {property.gallery.length > 5 && (
                    <div className="col-span-1 row-span-1 relative rounded-xl overflow-hidden bg-slate-900 cursor-pointer group">
                      <img src={property.gallery[5]} alt="More" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">+{property.gallery.length - 5}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sticky Tabs Navigation */}
            <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-slate-200 p-1.5 flex items-center gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'features' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Tiện ích & Đặc điểm
              </button>
              {property.videos && property.videos.length > 0 && (
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'video' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Video
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-xl font-bold text-primary mb-4 font-display">Mô tả chi tiết</h3>
                  <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                    {property.description || "Đang cập nhật mô tả..."}
                  </div>

                  {/* Quick Specs in Overview */}
                  <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-slate-100">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="block text-xs text-slate-400 font-bold uppercase mb-1">Loại hình</span>
                      <span className="font-bold text-primary">{property.type}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="block text-xs text-slate-400 font-bold uppercase mb-1">Hướng</span>
                      <span className="font-bold text-primary">{property.direction || '---'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="block text-xs text-slate-400 font-bold uppercase mb-1">Phòng ngủ</span>
                      <span className="font-bold text-primary">{property.bedroom || '---'}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="block text-xs text-slate-400 font-bold uppercase mb-1">Pháp lý</span>
                      <span className="font-bold text-primary">{property.legal || 'Đang cập nhật'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-xl font-bold text-primary mb-6 font-display">Tiện ích & Đặc điểm nổi bật</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(property.features && property.features.length > 0 ? property.features : ['Đang cập nhật']).map((feat: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-50 hover:border-indigo-100 transition-colors">
                        <div className="mt-0.5 size-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                        <span className="font-bold text-slate-700">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'video' && property.videos && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                  {property.videos.map((video: any, idx: number) => {
                    let embedUrl = video.url;
                    if (video.type === 'youtube') {
                      const videoId = video.url.includes('v=') ? video.url.split('v=')[1]?.split('&')[0] : video.url.split('youtu.be/')[1];
                      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    }
                    return (
                      <div key={idx} className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                        {video.type === 'youtube' ? (
                          <iframe src={embedUrl} title={`Video ${idx}`} className="w-full h-full" allowFullScreen></iframe>
                        ) : (
                          <video controls className="w-full h-full"><source src={video.url} type="video/mp4" /></video>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Agent Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg sticky top-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop" alt="Agent" className="size-16 rounded-full object-cover ring-4 ring-primary/5" />
                  <div className="absolute bottom-0 right-0 size-4 bg-emerald-500 rounded-full ring-2 ring-white"></div>
                </div>
                <div>
                  <p className="font-bold text-lg text-primary">Trần Minh</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Senior Agent</p>
                </div>
              </div>
              <div className="space-y-3">
                <button className="w-full h-12 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">call</span> 0909 123 456
                </button>
                <button className="w-full h-12 bg-white border-2 border-slate-100 text-primary rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">chat_bubble</span> Nhắn Zalo
                </button>
              </div>
            </div>

            {/* Specifications Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
              <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">info</span>
                Thông tin tóm tắt
              </h4>
              <div className="space-y-3 divide-y divide-slate-50">
                {property.project && <div className="flex justify-between py-2"><span className="text-xs font-bold text-slate-400 uppercase">Dự án</span><span className="text-sm font-bold">{property.project}</span></div>}
                {property.floors && <div className="flex justify-between py-2"><span className="text-xs font-bold text-slate-400 uppercase">Kết cấu</span><span className="text-sm font-bold">{property.floors}</span></div>}
                {property.frontage && <div className="flex justify-between py-2"><span className="text-xs font-bold text-slate-400 uppercase">Mặt tiền</span><span className="text-sm font-bold">{property.frontage}</span></div>}
              </div>
            </div>

            {/* Interest Calculator */}
            <div className="bg-gradient-to-br from-primary to-primary-dark p-6 rounded-3xl text-white shadow-xl">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">calculate</span> Tính lãi vay
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-white/60 uppercase">Vay (VNĐ)</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={e => setLoanAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white focus:bg-white/20 outline-none font-bold"
                  />
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/60 font-medium mb-1">Trả hàng tháng</p>
                  <p className="text-2xl font-black text-accent">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(monthlyPayment)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;