import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useBranding } from '../../../contexts/BrandingContext';

const Services: React.FC = () => {
  const { branding } = useBranding();
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [socialStats, setSocialStats] = useState([
    { platform: 'TikTok', handle: '@trannminh.bds', followers: '150K', views: '2.5M+', icon: 'tiktok', color: 'bg-black text-white' },
    { platform: 'Facebook', handle: 'Trần Minh Real Estate', followers: '45K', views: '800K+', icon: 'facebook', color: 'bg-blue-600 text-white' },
    { platform: 'YouTube', handle: 'Minh Review Nhà', followers: '20K', views: '500K+', icon: 'smart_display', color: 'bg-red-600 text-white' },
  ]);

  const [reviewPackages, setReviewPackages] = useState([
    {
      name: 'Gói Cơ Bản',
      price: '5.000.000đ',
      desc: 'Phù hợp căn hộ, nhà phố nhỏ',
      features: ['1 Video ngắn (TikTok/Reels)', 'Chụp ảnh HDR cơ bản', 'Đăng tin trên Fanpage & Zalo', 'Hỗ trợ chạy Ads cơ bản'],
      recommend: false
    },
    {
      name: 'Gói Chuyên Nghiệp',
      price: '12.000.000đ',
      desc: 'Tối ưu cho Biệt thự, Penthouse',
      features: ['1 Video Review chi tiết (YouTube)', '2 Video ngắn (TikTok/Reels)', 'Quay Flycam (Drone) toàn cảnh', 'Kịch bản Storytelling cảm xúc', 'Chiến dịch Ads đa nền tảng'],
      recommend: true
    },
    {
      name: 'Gói Ký Gửi Độc Quyền',
      price: 'Miễn Phí Review',
      desc: 'Dành cho chủ nhà ký HĐ độc quyền',
      features: ['Bao gồm toàn bộ quyền lợi Gói Chuyên Nghiệp', 'Cam kết đẩy tin Top 1 hiển thị', 'Tập trung nguồn lực Sale 100%', 'Phí môi giới theo thỏa thuận'],
      recommend: false
    }
  ]);

  const [brokerageFees, setBrokerageFees] = useState([
    { type: 'Bán Nhà phố / Căn hộ (Dưới 5 Tỷ)', fee: '2% - 3%', note: 'Tùy vị trí và thanh khoản' },
    { type: 'Bán Nhà phố / Biệt thự (Trên 10 Tỷ)', fee: '1% - 2%', note: 'Thương lượng theo gói Marketing' },
    { type: 'Cho thuê (Hợp đồng > 1 năm)', fee: '1 tháng tiền thuê', note: 'Thanh toán ngay khi ký HĐ' },
    { type: 'Cho thuê (Hợp đồng > 3 năm)', fee: '1.5 tháng tiền thuê', note: 'Hỗ trợ quản lý năm đầu' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'settings', 'services');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.socialStats) setSocialStats(data.socialStats);
          if (data.packages) setReviewPackages(data.packages);
          if (data.brokerageFees) setBrokerageFees(data.brokerageFees);
          if (data.isVisible !== undefined) setIsVisible(data.isVisible);
        }
      } catch (error) {
        console.error("Error fetching services data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;

  if (!isVisible) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-white">
        <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-slate-300">engineering</span>
        </div>
        <h2 className="text-2xl font-bold text-primary font-display mb-2">Dịch vụ đang cập nhật</h2>
        <p className="text-slate-500 max-w-md">Hiện tại chúng tôi đang nâng cấp bảng giá và gói dịch vụ. Vui lòng quay lại sau hoặc liên hệ trực tiếp để được tư vấn.</p>
        <Link to="/contact" className="mt-8 px-8 h-12 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
          Liên hệ ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white font-body">
      {/* Hero */}
      <section className="relative py-20 bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={branding.servicesBanner || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000&auto=format&fit=crop"} className="w-full h-full object-cover" alt="Media Production" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent text-accent text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
            Media & Brokerage Services
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Nâng Tầm Giá Trị <br /> <span className="text-accent">Bất Động Sản Của Bạn</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Kết hợp sức mạnh của truyền thông đa phương tiện và mạng lưới môi giới chuyên nghiệp để thanh khoản bất động sản nhanh chóng.
          </p>
        </div>
      </section>

      {/* Social Media Kit */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-primary font-display uppercase tracking-tight">Hệ Sinh Thái Truyền Thông</h2>
            <p className="text-slate-500 mt-2">Sức ảnh hưởng thực tế trên các nền tảng mạng xã hội.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {socialStats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-lg transition-all">
                <div className={`size-16 rounded-2xl flex items-center justify-center text-2xl ${stat.color}`}>
                  {stat.icon === 'tiktok' ? (
                    <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                  ) : (
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.platform}</p>
                  <p className="text-sm font-bold text-primary mb-1">{stat.handle}</p>
                  <div className="flex gap-4 text-sm">
                    <div><span className="font-black text-slate-900">{stat.followers}</span> <span className="text-slate-500 text-xs">Followers</span></div>
                    <div><span className="font-black text-slate-900">{stat.views}</span> <span className="text-slate-500 text-xs">Views</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Packages */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary font-display uppercase tracking-tight">Bảng Giá Dịch Vụ Review</h2>
            <p className="text-slate-500 mt-2">Đầu tư hình ảnh chuyên nghiệp để tiếp cận khách hàng tiềm năng.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {reviewPackages.map((pkg, idx) => (
              <div key={idx} className={`relative bg-white rounded-[2.5rem] p-8 border transition-all ${pkg.recommend ? 'border-accent shadow-2xl scale-105 z-10' : 'border-slate-100 shadow-lg hover:border-primary/30'}`}>
                {pkg.recommend && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Khuyên dùng
                  </div>
                )}
                <h3 className="text-xl font-black text-primary font-display uppercase text-center mb-2">{pkg.name}</h3>
                <p className="text-center text-slate-500 text-sm mb-6">{pkg.desc}</p>
                <div className="text-center mb-8">
                  <span className="text-3xl font-black text-primary">{pkg.price}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {pkg.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                      <span className="material-symbols-outlined text-accent text-lg shrink-0">check_circle</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/contact" className={`flex items-center justify-center w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${pkg.recommend ? 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  Đăng ký ngay
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brokerage Fee */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div>
              <h2 className="text-3xl font-bold font-display uppercase tracking-tight">Biểu Phí Môi Giới</h2>
              <p className="text-slate-400 mt-2">Minh bạch, rõ ràng và cam kết hiệu quả.</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-xs font-bold">
              Áp dụng từ 01/01/2024
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/10 text-xs font-black uppercase tracking-widest text-slate-300">
                <tr>
                  <th className="p-6">Loại hình / Giá trị BĐS</th>
                  <th className="p-6 text-right">Phí Môi Giới</th>
                  <th className="p-6 hidden md:table-cell">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm font-medium">
                {brokerageFees.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-6">{item.type}</td>
                    <td className="p-6 text-right font-bold text-accent">{item.fee}</td>
                    <td className="p-6 text-slate-400 hidden md:table-cell">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;