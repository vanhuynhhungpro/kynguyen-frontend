import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useBranding } from '../../../contexts/BrandingContext';

const About: React.FC = () => {
  const { branding, tenantId } = useBranding();
  const [data, setData] = useState({
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
          const fetchedData = docSnap.data();
          setData(prev => ({
            hero: { ...prev.hero, ...fetchedData.hero },
            personal: { ...prev.personal, ...fetchedData.personal },
            cta: { ...prev.cta, ...fetchedData.cta }
          }));
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
      }
    };
    fetchData();
  }, [tenantId]);

  return (
    <div className="bg-white font-body">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={data.hero.imageUrl || branding.aboutBanner}
            alt="Real Estate Agent"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent text-accent text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
            Professional Profile
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
            {data.hero.title} <br /> <span className="text-accent">{data.hero.subtitle}</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {data.hero.description}
          </p>
        </div>
      </section>

      {/* Personal Story */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={data.personal.imageUrl}
                  alt="Portrait"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-2xl shadow-xl max-w-xs hidden md:block border border-slate-100">
                <p className="font-display font-bold text-4xl text-primary mb-1">{data.personal.yearsExperience}</p>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Năm kinh nghiệm</p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-6">{data.personal.greeting}</h2>
              <h3 className="text-xl font-medium text-slate-500 mb-8">{data.personal.role}</h3>

              <div className="space-y-6 text-slate-600 leading-relaxed whitespace-pre-wrap">
                {data.personal.description}
              </div>

              <div className="mt-10 pt-10 border-t border-slate-100 grid grid-cols-3 gap-8">
                <div>
                  <p className="text-3xl font-black text-primary mb-1">{data.personal.transactions}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Giao dịch</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-primary mb-1">{data.personal.customers}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Khách hàng</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-primary mb-1">{data.personal.satisfaction}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">Hài lòng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values / Services */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-accent font-bold uppercase tracking-widest text-sm mb-2 block">Dịch vụ chuyên nghiệp</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary">Giải Pháp Bất Động Sản Toàn Diện</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'home_work',
                title: 'Môi Giới & Ký Gửi',
                desc: 'Kết nối người mua và người bán với quy trình chuyên nghiệp, nhanh chóng và bảo mật thông tin tuyệt đối.'
              },
              {
                icon: 'analytics',
                title: 'Tư Vấn Đầu Tư',
                desc: 'Phân tích chuyên sâu về thị trường, dòng tiền và tiềm năng tăng giá để tối đa hóa lợi nhuận cho nhà đầu tư.'
              },
              {
                icon: 'gavel',
                title: 'Hỗ Trợ Pháp Lý',
                desc: 'Đồng hành xử lý các thủ tục giấy tờ, sang tên, công chứng, đảm bảo tính pháp lý an toàn cho mọi giao dịch.'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[200px] text-white">handshake</span>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">{data.cta.title}</h2>
              <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
                {data.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact" className="h-14 px-10 bg-accent text-white rounded-xl font-bold flex items-center justify-center hover:bg-accent-dark transition-all shadow-lg shadow-accent/20">
                  Liên hệ tư vấn ngay
                </Link>
                <Link to="/products" className="h-14 px-10 bg-white/10 text-white border border-white/20 rounded-xl font-bold flex items-center justify-center hover:bg-white hover:text-primary transition-all">
                  Xem danh sách nhà đất
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
