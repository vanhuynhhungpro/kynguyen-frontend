
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ArticleDetail {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content_html: string;
  date: string;
  img: string;
  author?: string;
  readTime?: string;
  seo_title?: string;
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / scrollHeight) * 100;
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    
    const fetchArticle = async () => {
      try {
        const docRef = doc(db, 'news', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setArticle({ 
            id: docSnap.id, 
            ...data,
            // Fallback for old records
            content_html: data.content_html || data.content || '',
            excerpt: data.excerpt || data.desc || ''
          } as ArticleDetail);
          
          // Set dynamic SEO Title
          document.title = data.seo_title || data.title || 'LUCE BIO TECH NEWS';
        } else {
          console.error("Article not found");
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light p-4 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">find_in_page</span>
        <h2 className="text-2xl font-bold text-primary mb-2">Không tìm thấy bài viết</h2>
        <p className="text-slate-500 mb-8">Bài viết bạn đang tìm kiếm không tồn tại hoặc đã được gỡ bỏ.</p>
        <Link to="/news" className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-widest">Quay lại Tin Tức</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen relative pb-24">
      {/* Reading Progress Bar */}
      <div className="fixed top-20 left-0 w-full h-1 z-[60] bg-slate-100">
        <div 
          className="h-full bg-accent transition-all duration-100" 
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
        <img src={article.img} className="absolute inset-0 w-full h-full object-cover" alt={article.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-12 left-0 w-full">
           <div className="max-w-4xl mx-auto px-6">
              <span className="inline-block px-4 py-1.5 bg-accent text-white text-[11px] font-black rounded-lg tracking-widest uppercase mb-6 shadow-lg">
                {article.category}
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-white font-display leading-tight tracking-tight mb-8">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/70 text-sm font-bold">
                 <div className="flex items-center gap-2">
                    <img src="https://i.pravatar.cc/150?u=scientist" className="size-8 rounded-full border-2 border-white/20" alt="Author" />
                    <span>{article.author || 'TS. Nguyễn Dương Nguyên'}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {article.date}
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {article.readTime || '5 phút đọc'}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-6 pt-16">
        <div className="prose prose-slate lg:prose-xl max-w-none 
          prose-headings:font-display prose-headings:font-black prose-headings:text-primary 
          prose-p:text-slate-900 prose-p:leading-relaxed 
          prose-li:text-slate-900 prose-strong:text-primary prose-strong:font-black
          prose-table:text-black prose-td:text-black prose-th:text-black prose-th:font-black">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeRaw]}
          >
            {article.content_html}
          </ReactMarkdown>
        </div>

        {/* Share & Footer Tags */}
        <div className="mt-20 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tags:</span>
              <div className="flex flex-wrap gap-2">
                 {['R&D', 'Mỹ phẩm', 'Khoa học'].map(tag => (
                   <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-md border border-slate-100">#{tag}</span>
                 ))}
              </div>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chia sẻ:</span>
              <div className="flex gap-2">
                 {['facebook', 'linkedin', 'share'].map(icon => (
                   <button key={icon} className="size-10 rounded-full bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">{icon === 'share' ? 'link' : icon}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </main>

      {/* Navigation Buttons */}
      <div className="max-w-4xl mx-auto px-6 mt-16 flex justify-between">
         <button onClick={() => navigate('/news')} className="flex items-center gap-2 text-slate-400 hover:text-primary transition-all font-bold text-sm">
            <span className="material-symbols-outlined">arrow_back</span> Quay lại danh sách
         </button>
         <div className="flex gap-4">
            <button className="size-11 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center transition-all">
               <span className="material-symbols-outlined">bookmark</span>
            </button>
            <button className="size-11 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 flex items-center justify-center transition-all">
               <span className="material-symbols-outlined">thumb_up</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
