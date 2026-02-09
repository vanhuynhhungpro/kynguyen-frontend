
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useBranding } from '../contexts/BrandingContext';

const Footer: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [contactInfo, setContactInfo] = useState({
    email: 'admin@kynguyenrealai.com',
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
    // Lắng nghe thay đổi dữ liệu contact thời gian thực
    const unsubscribe = onSnapshot(doc(db, 'settings', 'contact_info'), (doc) => {
      if (doc.exists()) {
        setContactInfo(prev => ({ ...prev, ...doc.data() }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Ẩn Footer ở các trang quản trị
  const hiddenOnPaths = [
    '/dashboard', '/ingredient-library', '/my-projects',
    '/market-trends', '/create-project', '/add-ingredient',
    '/settings', '/manage-news', '/edit-news', '/manage-categories', '/manage-tags', '/manage-contact'
  ];

  const isHidden = hiddenOnPaths.some(path =>
    location.pathname === path || location.pathname.startsWith('/edit-news')
  );

  if (isHidden) return null;

  const { branding } = useBranding();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter subscription:', email);
    alert('Cảm ơn bạn đã đăng ký nhận bản tin khoa học!');
    setEmail('');
  };

  const socialIcons = [
    { name: 'Facebook', url: contactInfo.facebook, path: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' },
    { name: 'YouTube', url: contactInfo.youtube, path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505a3.017 3.017 0 0 0-2.122 2.136C0 8.055 0 12 0 12s0 3.945.501 5.814a3.017 3.017 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.945 24 12 24 12s0-3.945-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    { name: 'LinkedIn', url: contactInfo.linkedin, path: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a2.7 2.7 0 0 0-2.7-2.7c-1.2 0-2.1.7-2.5 1.4v-1.1h-2.5v7.7h2.5v-4.4c0-.6.5-1.1 1.1-1.1s1.1.5 1.1 1.1v4.4h2.5M8.1 18.5v-7.7H5.5v7.7h2.6m-.1-10.1a1.3 1.3 0 0 0 0-2.6 1.3 1.3 0 0 0 0 2.6z' },
    { name: 'Zalo', url: contactInfo.zalo, path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.46 12.67c-.2.56-.7.83-1.2.83-.17 0-.35-.03-.53-.08-1.05-.31-1.7-.85-2.23-1.42-.53.57-1.18 1.11-2.23 1.42-.18.05-.36.08-.53.08-.5 0-1-.27-1.2-.83-.26-.74.12-1.55.85-1.82.7-.26 1.18-.71 1.55-1.18-.37-.47-.85-.92-1.55-1.18-.73-.27-1.11-1.08-.85-1.82.26-.74 1.07-1.12 1.82-.85.7.26 1.11.71 1.42 1.11.31-.4.72-.85 1.42-1.11.75-.27 1.56.11 1.82.85.26.74-.12 1.55-.85 1.82-.7.26-1.18.71-1.55 1.18.37.47.85.92 1.55 1.18.73.27 1.11 1.08.85 1.82z' }
  ];

  return (
    <footer className="bg-white border-t border-slate-100 font-body">
      {/* 1) MAIN FOOTER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 text-left">

          {/* Cột 1: Brand block */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-2xl filled-icon">science</span>
                </div>
              )}
              <span className="font-display font-bold text-xl text-primary tracking-tight uppercase">{branding.companyName}</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Đối tác tin cậy trong lĩnh vực bất động sản,<br />
              mang đến không gian sống đẳng cấp & cơ hội đầu tư bền vững.
            </p>
            <div className="space-y-3 pt-2">
              {[
                { icon: 'verified', text: 'Pháp lý minh bạch' },
                { icon: 'apartment', text: 'Dự án chọn lọc' },
                { icon: 'handshake', text: 'Tư vấn tận tâm' }
              ].map((trust, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] font-bold text-primary/80 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-accent text-lg">{trust.icon}</span>
                  {trust.text}
                </div>
              ))}
            </div>
          </div>

          {/* Cột 2: Khám phá */}
          <div className="text-left">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Khám Phá</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/products" className="text-primary hover:text-accent transition-colors">Bất động sản</Link></li>
              <li><Link to="/news" className="text-primary hover:text-accent transition-colors">Tin tức thị trường</Link></li>
              <li><Link to="/solutions" className="text-primary hover:text-accent transition-colors">Dịch vụ ký gửi</Link></li>
              <li><Link to="/about" className="text-primary hover:text-accent transition-colors">Về tôi</Link></li>
            </ul>
          </div>

          {/* Cột 3: Tài nguyên */}
          <div className="text-left">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Tài Nguyên</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/products" className="text-primary hover:text-accent transition-colors">Danh sách dự án</Link></li>
              <li><Link to="/news" className="text-primary hover:text-accent transition-colors">Cẩm nang mua nhà</Link></li>
              <li><Link to="/faq" className="text-primary hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="text-primary hover:text-accent transition-colors">Liên hệ hợp tác</Link></li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div className="space-y-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Liên Hệ</h4>
            <div className="space-y-4 text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-300 text-lg">mail</span>
                <span>{contactInfo.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-300 text-lg">call</span>
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-300 text-lg">location_on</span>
                <span>{contactInfo.address}</span>
              </div>
            </div>

            <div className="flex gap-3">
              {socialIcons.map((social, idx) => (
                <a
                  key={idx}
                  href={social.url || '#'}
                  target={social.url ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className={`size-10 rounded-full border border-slate-100 flex items-center justify-center transition-all duration-300 ${social.url ? 'text-slate-400 hover:text-white hover:bg-accent hover:border-accent' : 'text-slate-200 cursor-not-allowed'}`}
                  aria-label={social.name}
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2) CTA BAR */}
      <div className="bg-slate-50 border-y border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <h3 className="text-xl font-display font-bold text-primary">Nhận thông tin dự án mới nhất</h3>
            <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto max-w-md gap-2">
              <input
                type="email"
                required
                placeholder="Email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 px-5 rounded-xl border border-slate-200 bg-white text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <button
                type="submit"
                className="px-8 h-12 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/10"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3) BOTTOM BAR */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2">
              <p className="text-xs font-bold text-slate-400">
                {contactInfo.copyright || "© 2026 KyNguyenRealAI. BẢO LƯU MỌI QUYỀN."}
              </p>
              <div className="flex flex-col md:flex-row justify-center md:justify-start gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest items-center">
                <Link to="/privacy" className="hover:text-primary transition-colors">Chính sách bảo mật</Link>
                <span>·</span>
                <Link to="/terms" className="hover:text-primary transition-colors">Điều khoản</Link>
                <span>·</span>
                <Link to="/cookies" className="hover:text-primary transition-colors">Cookie</Link>
                <span className="hidden md:inline">·</span>
                <a
                  href={`https://app.kynguyenrealai.com/register?ref=${localStorage.getItem('REF_CODE') || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[10px]">bolt</span>
                  Powered by KynguyenRealAI
                </a>
              </div>
            </div>
            <div className="max-w-xs text-center md:text-right">
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                {contactInfo.disclaimer || "* Thông tin chỉ mang tính tham khảo, vui lòng liên hệ trực tiếp để được tư vấn chính xác nhất."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
