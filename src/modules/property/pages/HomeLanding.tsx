import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../../contexts/BrandingContext';
import { db } from '../../../firebase';
import { collection, getDocs, query, limit, orderBy, doc, getDoc } from 'firebase/firestore';

interface Property {
  id: string;
  title: string;
  price: string;
  area: string;
  location: string;
  imageUrl: string;
  type: string;
  status: string;
}

interface AboutData {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    imageUrl: string;
  };
  personal: {
    greeting: string;
    role: string;
    description: string;
    imageUrl: string;
    yearsExperience: string;
    transactions: string;
    customers: string;
    satisfaction: string;
  };
}

const RealEstateHome: React.FC = () => {
  const { branding } = useBranding();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [searchMode, setSearchMode] = useState<'sale' | 'rent'>('sale');


  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'), limit(6));
        const querySnapshot = await getDocs(q);
        const props = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(props);
      } catch (error) {
        console.error("Error fetching properties:", error);
        // Mock data if fetch fails or empty (for demo purposes)
        if (properties.length === 0) {
          setProperties([
            { id: '1', title: 'Biệt thự ven sông Thảo Điền', price: '45 Tỷ', area: '300m²', location: 'Thảo Điền, Q.2', imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop', type: 'Biệt thự', status: 'Đang bán' },
            { id: '2', title: 'Penthouse Landmark 81', price: '22 Tỷ', area: '150m²', location: 'Bình Thạnh, TP.HCM', imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop', type: 'Căn hộ', status: 'Đang bán' },
            { id: '3', title: 'Nhà phố thương mại Sala', price: '68 Tỷ', area: '120m²', location: 'Thủ Thiêm, Q.2', imageUrl: 'https://images.unsplash.com/photo-1600596542815-2250c3855285?q=80&w=1000&auto=format&fit=crop', type: 'Nhà phố', status: 'Đang bán' },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchAboutData = async () => {
      try {
        const docRef = doc(db, 'settings', 'about');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAboutData(docSnap.data() as AboutData);
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
      }
    };

    fetchProperties();
    fetchAboutData();
  }, []);

  return (
    <div className="bg-slate-50 font-body min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center py-20 lg:py-0">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={branding.heroImageUrl || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2000&auto=format&fit=crop"}
            alt="Luxury Home"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/30"></div>
          {/* Decorative gradients */}
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-900 to-transparent opacity-90"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            Real Estate Agent
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-medium text-white mb-6 leading-[1.2] whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 drop-shadow-lg">
            {branding.heroTitle || "Kiến Tạo Không Gian\nSống Đẳng Cấp"}
          </h1>

          <p className="text-slate-200 text-lg md:text-xl font-light mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 leading-relaxed drop-shadow-md">
            {branding.heroSubtitle || "Kết nối những giá trị tinh hoa. Nơi giấc mơ an cư trở thành hiện thực với bộ sưu tập bất động sản độc bản."}
          </p>

          {/* Scientific Search Box */}
          <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex justify-center mb-4">
              <div className="bg-black/30 backdrop-blur-md p-1 rounded-full inline-flex gap-1 border border-white/20">
                <button
                  onClick={() => setSearchMode('sale')}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${searchMode === 'sale' ? 'bg-white text-primary shadow-lg scale-105' : 'text-white hover:bg-white/10'}`}>
                  MUA BÁN
                </button>
                <button
                  onClick={() => setSearchMode('rent')}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${searchMode === 'rent' ? 'bg-white text-primary shadow-lg scale-105' : 'text-white hover:bg-white/10'}`}>
                  CHO THUÊ
                </button>
              </div>
            </div>
            <div className="bg-white/95 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl shadow-black/20 flex flex-col lg:flex-row gap-2 border border-white/50 ring-1 ring-slate-100">

              {/* Location Input */}
              <div className="flex-1 bg-slate-50 lg:bg-transparent rounded-2xl lg:rounded-none px-5 py-4 lg:py-2 border-b lg:border-b-0 lg:border-r border-slate-200/50 hover:bg-slate-50/80 transition-colors group text-left">
                <div className="flex items-center gap-3 mb-1">
                  <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform">location_on</span>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vị trí</label>
                </div>
                <input
                  type="text"
                  placeholder="Quận, Phường, Dự án..."
                  className="w-full bg-transparent font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none text-base truncate"
                />
              </div>

              {/* Type Input */}
              <div className="flex-1 bg-slate-50 lg:bg-transparent rounded-2xl lg:rounded-none px-5 py-4 lg:py-2 border-b lg:border-b-0 lg:border-r border-slate-200/50 hover:bg-slate-50/80 transition-colors group text-left">
                <div className="flex items-center gap-3 mb-1">
                  <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform">domain</span>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại hình</label>
                </div>
                <select className="w-full bg-transparent font-bold text-slate-800 outline-none text-base cursor-pointer appearance-none">
                  <option>Căn hộ cao cấp</option>
                  <option>Nhà phố liền kề</option>
                  <option>Biệt thự nghỉ dưỡng</option>
                  <option>Penthouse / Sky Villa</option>
                  <option>Đất nền dự án</option>
                </select>
              </div>

              {/* Price Input */}
              <div className="flex-1 bg-slate-50 lg:bg-transparent rounded-2xl lg:rounded-none px-5 py-4 lg:py-2 hover:bg-slate-50/80 transition-colors group text-left">
                <div className="flex items-center gap-3 mb-1">
                  <span className="material-symbols-outlined text-accent text-xl group-hover:scale-110 transition-transform">attach_money</span>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mức giá</label>
                </div>
                <select className="w-full bg-transparent font-bold text-slate-800 outline-none text-base cursor-pointer appearance-none">
                  <option>Mọi mức giá</option>
                  <option>Dưới 5 Tỷ</option>
                  <option>5 - 10 Tỷ</option>
                  <option>10 - 20 Tỷ</option>
                  <option>Trên 20 Tỷ</option>
                </select>
              </div>

              {/* Search Button */}
              <button className="lg:w-auto w-full bg-primary hover:bg-primary-dark text-white rounded-[1.5rem] px-8 py-4 lg:py-0 font-bold transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 group">
                <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">search</span>
                <span className="lg:hidden">{searchMode === 'sale' ? 'Tìm Mua' : 'Tìm Thuê'}</span>
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-6 text-sm font-medium text-white/70 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <span>Phổ biến:</span>
              <a href="#" className="hover:text-accent hover:underline decoration-accent underline-offset-4 transition-all">#Vinhome Central Park</a>
              <a href="#" className="hover:text-accent hover:underline decoration-accent underline-offset-4 transition-all">#Empire City</a>
              <a href="#" className="hover:text-accent hover:underline decoration-accent underline-offset-4 transition-all">#Sala Đại Quang Minh</a>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-display font-bold text-primary mb-2">Bất Động Sản Nổi Bật</h2>
            <p className="text-slate-500">Những dự án mới nhất được cập nhật liên tục.</p>
          </div>
          <Link to="/products" className="hidden md:flex items-center gap-2 text-accent font-bold hover:gap-3 transition-all">
            Xem tất cả <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {properties.map((item) => (
            <Link to={`/products/${item.id}`} key={item.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 block hover:-translate-y-2">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {item.type}
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-2xl font-display font-medium">{item.price}</p>
                </div>
                <div className="absolute bottom-4 right-4 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-accent/30">
                  {item.status}
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-display font-bold text-primary mb-3 line-clamp-1 group-hover:text-accent transition-colors">{item.title}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-6 font-medium">
                  <span className="material-symbols-outlined text-lg text-accent">location_on</span>
                  <span className="truncate">{item.location}</span>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-100/50">
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
                    <span className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-slate-50"><span className="material-symbols-outlined text-lg text-slate-400">square_foot</span> {item.area}</span>
                    <span className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-slate-50"><span className="material-symbols-outlined text-lg text-slate-400">bed</span> 3</span>
                    <span className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-slate-50"><span className="material-symbols-outlined text-lg text-slate-400">bathtub</span> 2</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/products" className="inline-flex items-center gap-2 text-accent font-bold">
            Xem tất cả <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </div>



      {/* Personal Brand Section */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 relative">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto relative z-10">
                <img src={aboutData?.personal?.imageUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1000&auto=format&fit=crop"} alt="Agent" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 size-48 bg-accent/10 rounded-full z-0 hidden lg:block"></div>
              <div className="absolute -top-6 -left-6 size-32 border-2 border-accent/20 rounded-full z-0 hidden lg:block"></div>
            </div>
            <div className="lg:w-1/2 text-center lg:text-left">
              <span className="text-accent font-bold uppercase tracking-widest text-sm mb-2 block">Về Tôi</span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-6">
                {aboutData?.personal?.greeting || "Chuyên Gia Tư Vấn Bất Động Sản Cao Cấp"}
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed whitespace-pre-wrap">
                {aboutData?.personal?.description || "Với hơn 10 năm kinh nghiệm trong lĩnh vực bất động sản hạng sang, tôi cam kết mang đến cho khách hàng những giải pháp đầu tư hiệu quả và không gian sống lý tưởng nhất. Sự hài lòng của bạn là thước đo thành công của tôi."}
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-3xl font-black text-primary mb-1">{aboutData?.personal?.transactions || "500+"}</h4>
                  <p className="text-sm text-slate-500 font-medium">Giao dịch thành công</p>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-primary mb-1">{aboutData?.personal?.satisfaction || "98%"}</h4>
                  <p className="text-sm text-slate-500 font-medium">Khách hàng hài lòng</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/contact" className="h-12 px-8 bg-primary text-white rounded-xl font-bold flex items-center justify-center hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                  Liên hệ tư vấn
                </Link>
                <Link to="/about" className="h-12 px-8 border border-slate-200 text-primary rounded-xl font-bold flex items-center justify-center hover:bg-white hover:border-primary transition-all">
                  Xem hồ sơ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateHome;