
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { useBranding } from '../../../contexts/BrandingContext';

interface Article {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  img: string;
  status?: 'published' | 'hidden';
}

const News: React.FC = () => {
  const { branding, tenantId } = useBranding();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Chỉ lấy những bài viết có trạng thái là published
    // Lưu ý: Nếu có lỗi "index missing", cần gỡ where và filter ở client hoặc tạo index trên Firestore
    if (!tenantId) return;
    const q = query(
      collection(db, 'news'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'published'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        excerpt: doc.data().excerpt || doc.data().desc || ''
      })) as Article[];
      setArticles(data);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi Firestore (có thể do chưa index tenantId). Fallback...", error);
      if (!tenantId) return;
      const qFallback = query(collection(db, 'news'), where('tenantId', '==', tenantId), orderBy('updatedAt', 'desc'));
      onSnapshot(qFallback, (snap) => {
        const filtered = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Article))
          .filter(a => a.status === 'published' || !a.status); // mặc định cũ là published
        setArticles(filtered);
        setLoading(false);
      });
    });
    return () => unsubscribe();
  }, [tenantId]);

  return (
    <div className="bg-white min-h-screen pb-20 font-body">
      <section className="bg-slate-900 text-white py-20 overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-20">
          <img src={branding.newsBanner || "https://images.unsplash.com/photo-1504384308090-c54be3852f33?q=80&w=2000&auto=format&fit=crop"} className="w-full h-full object-cover" alt="News Background" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent z-0"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 space-y-6 text-left">
            <span className="inline-block px-3 py-1 bg-accent text-white text-[10px] font-black rounded-lg tracking-widest uppercase">Tin Tức & Thị Trường</span>
            <h1 className="text-4xl md:text-5xl font-black font-display leading-tight tracking-tight">Góc Nhìn Chuyên Gia <br /> Bất Động Sản</h1>
            <p className="text-slate-300 text-lg font-medium leading-relaxed">
              Cập nhật những biến động mới nhất của thị trường, phân tích chuyên sâu và xu hướng đầu tư từ đội ngũ chuyên gia LUCE LAND.
            </p>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10 relative group">
              <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Featured" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6">
          <div className="text-left">
            <h2 className="text-3xl font-black text-primary font-display">Tiêu điểm thị trường</h2>
            <p className="text-slate-500 font-medium mt-1">Thông tin chính xác, đa chiều và kịp thời.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] p-4 border border-slate-100 animate-pulse h-96"></div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articles.map((article) => (
              <Link to={`/news/${article.id}`} key={article.id} className="group bg-white rounded-[2.5rem] shadow-card hover:shadow-soft transition-all overflow-hidden flex flex-col cursor-pointer border border-transparent hover:border-primary/10 text-left">
                <div className="h-64 overflow-hidden relative">
                  <img src={article.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={article.title} />
                  <div className="absolute top-6 left-6">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-primary text-[10px] font-black rounded-lg tracking-widest uppercase shadow-sm">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-accent">calendar_today</span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{article.date}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-4 leading-tight group-hover:text-accent transition-colors font-display line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 font-medium mb-8">
                    {article.excerpt}
                  </p>
                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] font-black text-primary uppercase tracking-widest group/btn">
                    <span className="flex items-center gap-2">
                      Đọc chi tiết <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="inline-flex size-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-6">
              <span className="material-symbols-outlined text-5xl">article</span>
            </div>
            <h3 className="text-2xl font-black text-primary font-display">Chưa có tin tức mới</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
