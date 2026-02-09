import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';

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

const parsePrice = (priceStr: string): number => {
  if (!priceStr || typeof priceStr !== 'string') return 0;
  const cleanStr = priceStr.toLowerCase().replace(/,/g, '.');
  let multiplier = 1;
  if (cleanStr.includes('tỷ')) multiplier = 1000000000;
  else if (cleanStr.includes('triệu')) multiplier = 1000000;

  const num = parseFloat(cleanStr.replace(/[^0-9.]/g, ''));
  return num ? num * multiplier : 0;
};

const Products: React.FC = () => {
  const { branding, tenantId } = useBranding();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [locationFilter, setLocationFilter] = useState('');
  const [priceRange, setPriceRange] = useState('all'); // all, <3ty, 3-7ty, 7-15ty, >15ty

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      setProperties([]);
      return;
    }

    // Lấy các BĐS có trạng thái "Đang bán" hoặc "Cho thuê"
    const q = query(collection(db, 'properties'), where('tenantId', '==', tenantId), where('status', 'in', ['Đang bán', 'Cho thuê']), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      // 1. Filter by Tab (Type or Status)
      if (activeTab === 'Cho thuê') {
        if (p.status !== 'Cho thuê') return false;
      } else if (activeTab !== 'Tất cả' && p.type !== activeTab) {
        return false;
      }

      // 2. Filter by Location
      if (locationFilter && !p.location.toLowerCase().includes(locationFilter.toLowerCase()) && !p.title.toLowerCase().includes(locationFilter.toLowerCase())) return false;

      // 3. Filter by Price
      if (priceRange !== 'all') {
        const priceVal = parsePrice(p.price);
        if (priceRange === '<3ty' && priceVal >= 3000000000) return false;
        if (priceRange === '3-7ty' && (priceVal < 3000000000 || priceVal > 7000000000)) return false;
        if (priceRange === '7-15ty' && (priceVal < 7000000000 || priceVal > 15000000000)) return false;
        if (priceRange === '>15ty' && priceVal <= 15000000000) return false;
      }

      return true;
    });
  }, [properties, activeTab, locationFilter, priceRange]);

  const categories = ['Tất cả', 'Cho thuê', 'Căn hộ', 'Nhà phố', 'Biệt thự', 'Đất nền'];

  return (
    <div className="bg-white min-h-screen font-body">
      <section className="bg-slate-900 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={branding.productsBanner || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop"} className="w-full h-full object-cover" alt="City" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent text-accent text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-sm">
            Danh sách độc quyền
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-display mb-6 tracking-tight">Bất Động Sản Cao Cấp</h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Tuyển tập những căn hộ, biệt thự, nhà phố và đất nền có vị trí đắc địa, pháp lý minh bạch và tiềm năng sinh lời cao nhất thị trường.
          </p>
        </div>
      </section>

      {/* Filter & Tabs Section */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">

            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === cat
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Global Search & Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  placeholder="Tìm theo khu vực, tên dự án..."
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border-none text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                />
              </div>
              <select
                value={priceRange}
                onChange={e => setPriceRange(e.target.value)}
                className="h-10 px-4 pl-3 pr-8 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-600 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer outline-none appearance-none"
                style={{ backgroundImage: 'none' }}
              >
                <option value="all">Mọi mức giá</option>
                <option value="<3ty">&lt; 3 Tỷ</option>
                <option value="3-7ty">3 - 7 Tỷ</option>
                <option value="7-15ty">7 - 15 Tỷ</option>
                <option value=">15ty">&gt; 15 Tỷ</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animation-in slide-in-from-bottom-4 duration-700">
            {filteredProperties.map((item) => (
              <Link to={`/products/${item.id}`} key={item.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img src={item.imageUrl || 'https://via.placeholder.com/400x300'} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-primary/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">{item.type}</span>
                    {item.status === 'Cho thuê' && (
                      <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">Cho thuê</span>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="bg-white/95 backdrop-blur-sm text-primary text-sm font-black px-4 py-2 rounded-xl shadow-lg border border-slate-100">{item.price}</span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-primary mb-2 font-display line-clamp-2 group-hover:text-accent transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                    <span className="material-symbols-outlined text-lg text-rose-500">location_on</span>
                    <span className="truncate font-medium">{item.location}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-sm font-medium text-slate-600">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg"><span className="material-symbols-outlined text-lg text-slate-400">square_foot</span> {item.area}</span>
                    <span className="text-accent font-bold text-xs uppercase tracking-wider group-hover:underline flex items-center gap-1">
                      Xem chi tiết <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4 h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto">filter_list_off</span>
            <h3 className="text-lg font-bold text-slate-500">Không tìm thấy bất động sản nào</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả.</p>
            <button onClick={() => { setActiveTab('Tất cả'); setLocationFilter(''); setPriceRange('all'); }} className="mt-6 px-6 py-2 bg-white border border-slate-200 shadow-sm rounded-full text-xs font-bold uppercase tracking-widest text-primary hover:bg-slate-50 transition-all">
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
