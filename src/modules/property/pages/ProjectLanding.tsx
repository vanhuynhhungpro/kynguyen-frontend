import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAnalytics } from '../../../hooks/useAnalytics';

const ProjectLanding: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  // We can't use the hook immediately with slug, we need ID.
  // We'll call trackView manually or wait until project is loaded.
  // Actually, let's just initialize it with slug but we need DocID for increment.
  // Better approach: Call hook once project is loaded.
  const [project, setProject] = useState<any>(null);

  // Custom Analytics Logic since we load by Slug first
  const { trackConversion } = useAnalytics('projects', project?.id);

  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!slug) return;
      setLoading(true);

      try {
        let foundProject = null;

        // 1. Ưu tiên: Tìm trong collection 'landing_pages' (Kiến trúc mới)
        const lpQuery = query(collection(db, 'landing_pages'), where('slug', '==', slug));
        const lpSnapshot = await getDocs(lpQuery);

        if (!lpSnapshot.empty) {
          const lpData = lpSnapshot.docs[0].data();

          // Nếu tìm thấy Landing Page, lấy thông tin Property gốc
          if (lpData.propertyId) {
            const propDocRef = doc(db, 'properties', lpData.propertyId);
            const propDocSnap = await getDoc(propDocRef);

            if (propDocSnap.exists()) {
              // Gộp dữ liệu Property + Cấu hình Landing Page
              foundProject = {
                id: propDocSnap.id,
                ...propDocSnap.data(),
                landingConfig: {
                  enabled: lpData.isActive,
                  heroTitle: lpData.heroTitle,
                  heroSubtitle: lpData.heroSubtitle,
                  themeColor: lpData.themeColor,
                  videoUrl: lpData.videoUrl,
                  locationMapUrl: lpData.locationMapUrl,
                  policy: lpData.policy,
                  sections: lpData.sections || [],
                  fontFamily: lpData.fontFamily,
                  heroOverlayOpacity: lpData.heroOverlayOpacity,
                  ctaText: lpData.ctaText
                }
              };
            }
          }
        }

        // 2. Fallback: Nếu không thấy, tìm trong 'properties' (Kiến trúc cũ)
        if (!foundProject) {
          const q = query(collection(db, 'properties'), where('slug', '==', slug));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            foundProject = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          }
        }

        setProject(foundProject);

      } catch (error) {
        console.error("Lỗi khi tải Landing Page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper Variables & Functions
  const landing = project?.landingConfig || {};
  const themeColor = landing.themeColor || '#0B3C49';
  const fontClass = landing.fontFamily || 'font-sans';
  const overlayOpacity = landing.heroOverlayOpacity ? landing.heroOverlayOpacity / 100 : 0.6;

  const getYoutubeEmbed = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Font Loading
  useEffect(() => {
    const fontMap: any = {
      'font-serif': 'Merriweather:300,400,700,900',
      'font-mono': 'Roboto Mono:400,700',
      'font-display': 'Playfair Display:400,700,900',
      'font-body': 'Roboto Slab:400,700',
      'font-hand': 'Dancing Script:400,700'
    };

    if (fontMap[fontClass]) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontMap[fontClass]}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); }
    }
  }, [fontClass]);

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;

  if (!project) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">domain_disabled</span>
      <h2 className="text-2xl font-bold text-primary">Không tìm thấy dự án</h2>
      <p className="text-slate-500 mt-2">Đường dẫn không tồn tại hoặc dự án đã ngừng hoạt động.</p>
      <Link to="/" className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all">Về trang chủ</Link>
    </div>
  );


  return (
    <div className={`bg-white ${fontClass}`}>
      {/* Sticky Navigation */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className={`font-display font-black text-xl uppercase tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>
            {project.title}
          </Link>
          <div className="hidden md:flex gap-8">
            {landing.menu && landing.menu.length > 0 ? (
              // Dynamic Menu
              landing.menu.map((item: any, idx: number) => (
                <button key={idx} onClick={() => scrollToSection(item.sectionId || 'overview')} className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                  {item.label}
                </button>
              ))
            ) : (
              // Default Static Menu
              ['overview', 'features', 'location', 'gallery', 'floorplan', 'policy'].map(section => (
                <button key={section} onClick={() => scrollToSection(section)} className={`text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                  {section === 'floorplan' ? 'Mặt bằng' : section === 'gallery' ? 'Thư viện' : section === 'location' ? 'Vị trí' : section === 'policy' ? 'Chính sách' : section === 'features' ? 'Tiện ích' : 'Tổng quan'}
                </button>
              ))
            )}
          </div>
          <button onClick={() => scrollToSection('contact')} className="px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105" style={{ backgroundColor: themeColor }}>
            {landing.ctaText || 'Đăng ký'}
          </button>
        </div>
      </div>

      {/* 1. Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={landing.heroImage || project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover animate-in fade-in zoom-in-125 duration-[20s] ease-linear scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" style={{ opacity: overlayOpacity }}></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-xs font-black uppercase tracking-widest mb-8 shadow-2xl backdrop-blur-md border border-white/20 bg-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {project.type} • {project.status}
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-white mb-6 leading-tight">
            {landing.heroTitle || project.title}
          </h1>
          <p className="text-lg md:text-2xl text-slate-200 font-medium max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow-md">
            {landing.heroSubtitle || project.location}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollToSection('contact')} className="h-14 px-10 text-white rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 hover:brightness-110" style={{ backgroundColor: themeColor }}>
              <span className="material-symbols-outlined">call</span> {landing.ctaText || 'Nhận báo giá'}
            </button>
            <button onClick={() => scrollToSection('overview')} className="h-14 px-10 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">info</span> Tìm hiểu thêm
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
          <span className="material-symbols-outlined text-3xl">keyboard_arrow_down</span>
        </div>
      </section>

      {/* 2. Overview & Features */}
      <section id="overview" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-black mb-4" style={{ color: themeColor }}>TỔNG QUAN DỰ ÁN</h2>
                <div className="h-1 w-20" style={{ backgroundColor: themeColor }}></div>
              </div>
              <div className="prose prose-lg text-slate-600 leading-relaxed">
                <p>{project.description || landing.overview || "Đang cập nhật thông tin chi tiết..."}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Diện tích</p>
                  <p className="text-2xl font-black text-slate-900">{project.area}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Giá bán từ</p>
                  <p className="text-2xl font-black" style={{ color: themeColor }}>{project.price}</p>
                </div>
              </div>

              {project.features && (
                <div className="space-y-4">
                  <h3 className="font-bold uppercase tracking-widest text-sm" style={{ color: themeColor }}>Tiện ích nổi bật</h3>
                  <div className="flex flex-wrap gap-3">
                    {project.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 hover:bg-white hover:shadow-md transition-all">
                        <span className="material-symbols-outlined text-base" style={{ color: themeColor }}>check_circle</span>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                <img src={project.imageUrl} alt="Overview" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-10 -right-10 size-64 rounded-full blur-3xl -z-0 opacity-20" style={{ backgroundColor: themeColor }}></div>
              <div className="absolute -bottom-10 -left-10 size-64 rounded-full blur-3xl -z-0 opacity-20" style={{ backgroundColor: themeColor }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.05 Dynamic Sections (Features/Highlights) */}
      {/* 2.05 Dynamic Sections (Features/Highlights) */}
      {landing.sections?.map((section: any, idx: number) => {
        const isDark = idx % 2 === 0;
        const bgClass = isDark ? 'bg-slate-50' : 'bg-white';

        if (section.type === 'features') {
          return (
            <section key={idx} className={`py-24 ${bgClass}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tight mb-4" style={{ color: themeColor }}>{section.title}</h3>
                  <p className="text-slate-500 max-w-2xl mx-auto text-lg">{section.content}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
                  {section.features?.map((f: any, i: number) => (
                    <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="size-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-purple-500/20" style={{ backgroundColor: themeColor }}>
                        <span className="material-symbols-outlined text-2xl">{f.icon || 'star'}</span>
                      </div>
                      <h4 className="font-bold text-xl mb-3 text-slate-900">{f.title}</h4>
                      <p className="text-slate-600 leading-relaxed">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'agent') {
          return (
            <section key={idx} className={`py-24 ${bgClass}`}>
              <div className="max-w-5xl mx-auto px-4">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-50 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 z-0"></div>

                  <div className="relative z-10 shrink-0">
                    <div className="size-48 md:size-64 rounded-full p-2 border-2 border-dashed border-slate-200">
                      <img src={section.agent?.avatarUrl || 'https://via.placeholder.com/300'} className="w-full h-full rounded-full object-cover shadow-lg" alt="Agent" />
                    </div>
                  </div>

                  <div className="relative z-10 text-center md:text-left flex-1 space-y-6">
                    <div>
                      <h3 className="text-3xl font-display font-black" style={{ color: themeColor }}>{section.agent?.name || 'Chuyên viên tư vấn'}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{section.agent?.role || 'Senior Consultant'}</p>
                    </div>
                    <p className="text-slate-600 text-lg italic leading-relaxed">"{section.content}"</p>

                    <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start pt-2">
                      <a href={`tel:${section.agent?.phone}`} className="h-12 px-8 rounded-full text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all" style={{ backgroundColor: themeColor }}>
                        <span className="material-symbols-outlined">call</span> {section.agent?.phone}
                      </a>
                      <a href={`mailto:${section.agent?.email}`} className="h-12 px-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">mail</span> Gửi Email
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'payment_schedule') {
          return (
            <section key={idx} className={`py-24 ${bgClass}`}>
              <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tight mb-4" style={{ color: themeColor }}>{section.title}</h3>
                  <p className="text-slate-500 max-w-2xl mx-auto text-lg">{section.content}</p>
                </div>

                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 hidden md:block"></div>
                  <div className="space-y-8">
                    {section.paymentSchedule?.map((item: any, i: number) => (
                      <div key={i} className="relative flex flex-col md:flex-row gap-6 md:items-center group">
                        <div className="size-16 rounded-2xl flex items-center justify-center font-black text-white shrink-0 shadow-lg relative z-10 transition-transform group-hover:scale-110" style={{ backgroundColor: themeColor }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all relative">
                          {/* Arrow for desktop */}
                          <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 size-4 bg-white rotate-45 border-l border-b border-slate-100 hidden md:block"></div>

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-xl text-slate-800">{item.stage}</h4>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100">{item.percentage}% GTCH</span>
                              </div>
                              <p className="text-slate-500">{item.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-lg inline-block">
                                Dự kiến: <span style={{ color: themeColor }}>{item.date || 'TBA'}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'interior') {
          return (
            <section key={idx} className={`py-24 ${bgClass}`}>
              <div className="max-w-[1400px] mx-auto px-4">
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tight mb-4" style={{ color: themeColor }}>{section.title}</h3>
                  <p className="text-slate-500 max-w-2xl mx-auto text-lg">{section.content}</p>
                </div>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {section.interiorImages?.map((img: any, i: number) => (
                    <div key={i} className="break-inside-avoid relative group rounded-3xl overflow-hidden shadow-lg cursor-zoom-in">
                      <img src={img.url} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" alt={img.roomName} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                        <span className="text-white font-display font-bold text-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{img.roomName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'contact') {
          return (
            <section key={idx} id="contact" className={`py-24 bg-slate-50`}>
              <div className="max-w-3xl mx-auto px-4 text-center">
                <h3 className="text-3xl md:text-4xl font-display font-black mb-6 uppercase" style={{ color: themeColor }}>{section.title}</h3>
                <p className="text-slate-600 mb-10 text-lg">{section.content}</p>

                <div className="bg-white p-8 rounded-3xl shadow-xl transform hover:scale-[1.01] transition-all duration-500">
                  <form className="space-y-4" onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
                    const email = (form.elements.namedItem('email') as HTMLInputElement).value;

                    if (!name || !phone) return alert('Vui lòng nhập tên và số điện thoại!');

                    try {
                      const timestamp = serverTimestamp();

                      // 1. Create Inquiry
                      await addDoc(collection(db, 'inquiries'), {
                        fullName: name,
                        phone: phone,
                        email: email || '',
                        company: 'Khách lẻ - Landing Page',
                        interest: project.title,
                        message: `Đăng ký nhận thông tin từ Landing Page dự án: ${project.title}`,
                        status: 'new',
                        createdAt: timestamp,
                        tenantId: project.tenantId // Use project's tenantId
                      });

                      // 2. Create/Update Customer
                      await addDoc(collection(db, 'customers'), {
                        name: name,
                        phone: phone,
                        email: email || '',
                        company: '',
                        address: '',
                        type: 'individual',
                        status: 'potential',
                        notes: `Nguồn: Landing Page ${project.title}`,
                        createdAt: timestamp,
                        tenantId: project.tenantId // Use project's tenantId
                      });

                      alert('Đăng ký thành công! Thông tin của bạn đã được ghi nhận vào hệ thống CSKH.');
                      form.reset();
                    } catch (err) {
                      console.error(err);
                      alert('Lỗi kết nối. Vui lòng thử lại.');
                    }
                  }}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <input name="name" required type="text" placeholder="Họ và tên" className="w-full h-14 px-6 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus:ring-2 focus:bg-white transition-all outline-none" style={{ '--tw-ring-color': themeColor } as any} />
                      <input name="phone" required type="tel" placeholder="Số điện thoại" className="w-full h-14 px-6 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus:ring-2 focus:bg-white transition-all outline-none" style={{ '--tw-ring-color': themeColor } as any} />
                    </div>
                    <input name="email" type="email" placeholder="Email (Tùy chọn)" className="w-full h-14 px-6 rounded-xl bg-slate-50 border-none font-bold text-slate-900 focus:ring-2 focus:bg-white transition-all outline-none" style={{ '--tw-ring-color': themeColor } as any} />
                    <button type="submit" className="w-full h-14 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: themeColor }}>
                      <span className="material-symbols-outlined">send</span> Gửi yêu cầu ngay
                    </button>
                  </form>
                  <p className="mt-6 text-xs text-slate-400 font-medium">
                    Hotline hỗ trợ 24/7: <a href="tel:0909000000" className="font-bold text-sm" style={{ color: themeColor }}>0909.000.000</a>
                  </p>
                </div>
              </div>
            </section>
          );
        }

        // Default Content
        return (
          <section key={idx} className={`py-24 ${bgClass}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`flex flex-col gap-12 lg:gap-20 ${section.layout === 'right' ? 'lg:flex-row-reverse' : section.layout === 'center' ? '' : 'lg:flex-row'} items-center`}>

                {section.layout !== 'center' && (
                  <div className="lg:w-1/2 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <img src={section.imageUrl || 'https://via.placeholder.com/800x600'} alt={section.title} className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]" />
                  </div>
                )}

                <div className={`${section.layout === 'center' ? 'w-full text-center max-w-4xl mx-auto' : 'lg:w-1/2'} space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150`}>
                  <h3 className="text-3xl md:text-4xl font-display font-black leading-tight" style={{ color: themeColor }}>{section.title}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">{section.content}</p>
                </div>

              </div>
            </div>
          </section>
        );
      })}

      {/* 2.1 Location Map Section */}
      {landing.locationMapUrl && (
        <section id="location" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-black mb-2" style={{ color: themeColor }}>VỊ TRÍ ĐẮC ĐỊA</h2>
              <p className="text-slate-500">{project.location}</p>
            </div>
            <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <iframe src={landing.locationMapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>
        </section>
      )}

      {/* 2.5 Video & Gallery Section */}
      {(landing.videoUrl || (project.gallery && project.gallery.length > 0)) && (
        <section id="gallery" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-black mb-2" style={{ color: themeColor }}>TRẢI NGHIỆM THỰC TẾ</h2>
              <p className="text-slate-500">Hình ảnh và Video thực tế tại dự án.</p>
            </div>

            {landing.videoUrl && (
              <div className="aspect-video w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl mb-16 border-4 border-white">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYoutubeEmbed(landing.videoUrl)}`}
                  title="Project Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {project.gallery && project.gallery.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.gallery.map((img: string, idx: number) => (
                  <div key={idx} className={`rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group ${idx === 0 ? 'col-span-2 row-span-2' : ''}`}>
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2.6 Floor Plans Section */}
      {project.floorPlans && project.floorPlans.length > 0 && (
        <section id="floorplan" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-black mb-2" style={{ color: themeColor }}>MẶT BẰNG TẦNG & CĂN HỘ</h2>
              <p className="text-slate-500">Thiết kế chi tiết và bố trí không gian.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {project.floorPlans.map((img: string, idx: number) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                  <img src={img} alt={`Floor Plan ${idx}`} className="w-full h-auto object-contain rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Policy Section (Nếu có) */}
      {landing.policy && (
        <section id="policy" className="py-20 text-white" style={{ backgroundColor: themeColor }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="material-symbols-outlined text-6xl text-white/80 mb-6">verified_user</span>
            <h2 className="text-3xl md:text-4xl font-display font-black mb-8">CHÍNH SÁCH BÁN HÀNG & PHÁP LÝ</h2>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/10 text-lg leading-relaxed whitespace-pre-wrap">
              {landing.policy}
            </div>
          </div>
        </section>
      )}

      {/* 4. Contact CTA */}
      <section id="contact" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-black mb-6" style={{ color: themeColor }}>ĐĂNG KÝ NHẬN THÔNG TIN</h2>
          <p className="text-slate-600 mb-10 text-lg">Để lại thông tin để nhận bảng giá chi tiết và ưu đãi độc quyền từ chủ đầu tư.</p>

          <div className="bg-white p-8 rounded-3xl shadow-xl">
            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
              const email = (form.elements.namedItem('email') as HTMLInputElement).value;

              if (!name || !phone) return alert('Vui lòng nhập tên và số điện thoại!');

              try {
                const timestamp = serverTimestamp();

                // 1. Create Inquiry
                await addDoc(collection(db, 'inquiries'), {
                  fullName: name,
                  phone: phone,
                  email: email || '',
                  company: 'Khách lẻ - Landing Page',
                  interest: project.title,
                  message: `Đăng ký nhận thông tin từ Landing Page dự án: ${project.title}`,
                  status: 'new',
                  createdAt: timestamp,
                  tenantId: project.tenantId // Use project's tenantId
                });

                // 2. Create/Update Customer
                await addDoc(collection(db, 'customers'), {
                  name: name,
                  phone: phone,
                  email: email || '',
                  company: '',
                  address: '',
                  type: 'individual',
                  status: 'potential',
                  notes: `Nguồn: Landing Page ${project.title}`,
                  createdAt: timestamp,
                  tenantId: project.tenantId // Use project's tenantId
                });

                alert('Đăng ký thành công! Thông tin của bạn đã được ghi nhận vào hệ thống CSKH.');
                trackConversion(); // Track Lead
                form.reset();
              } catch (err) {
                console.error(err);
                alert('Lỗi kết nối. Vui lòng thử lại.');
              }
            }}>
              <div className="grid md:grid-cols-2 gap-5">
                <input name="name" required type="text" placeholder="Họ và tên *" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:ring-2 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm placeholder:text-slate-400" style={{ '--tw-ring-color': themeColor } as any} />
                <input name="phone" required type="tel" placeholder="Số điện thoại *" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:ring-2 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm placeholder:text-slate-400" style={{ '--tw-ring-color': themeColor } as any} />
              </div>
              <input name="email" type="email" placeholder="Email (Nhận bảng giá & ưu đãi)" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-900 focus:ring-2 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm placeholder:text-slate-400" style={{ '--tw-ring-color': themeColor } as any} />

              <button type="submit" className="w-full h-16 text-white rounded-2xl font-black text-base uppercase tracking-widest hover:brightness-110 hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg flex items-center justify-center gap-2 group" style={{ backgroundColor: themeColor }}>
                <span className="material-symbols-outlined group-hover:animate-bounce">mail</span> Gửi yêu cầu ngay
              </button>
            </form>
            <p className="mt-6 text-xs text-slate-400 font-medium">
              Hotline hỗ trợ 24/7: <a href="tel:0909000000" className="font-bold text-sm" style={{ color: themeColor }}>0909.000.000</a>
            </p>
          </div>
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a href="tel:0909000000" className="size-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-bounce">
          <span className="material-symbols-outlined text-2xl">call</span>
        </a>
        <a href="https://zalo.me/0909000000" target="_blank" rel="noreferrer" className="size-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <span className="font-black text-xs">Zalo</span>
        </a>
      </div>

      {/* Sticky Mobile Contact Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-50 flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] slide-in-from-bottom duration-500">
        <a href="tel:0909000000" className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800">
          <span className="material-symbols-outlined text-lg">call</span> Gọi ngay
        </a>
        <button onClick={() => scrollToSection('contact')} className="flex-1 h-12 rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg" style={{ backgroundColor: themeColor }}>
          <span className="material-symbols-outlined text-lg">edit_note</span> Đăng ký
        </button>
      </div>

      {/* Footer Minimal */}
      <footer className="bg-white py-8 border-t border-slate-100 text-center mb-16 md:mb-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          © 2024 LUCE LAND - DỰ ÁN {project.title.toUpperCase()}
        </p>
      </footer>
    </div>
  );
};

export default ProjectLanding;