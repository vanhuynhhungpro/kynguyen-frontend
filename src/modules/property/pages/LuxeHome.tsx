import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../../contexts/BrandingContext';
import { db } from '../../../firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import '@fontsource/playfair-display'; // Import font

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

const LuxeHome: React.FC = () => {
    const { branding } = useBranding();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationQuery, setLocationQuery] = useState('');

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'), limit(3)); // Limit 3 for the row
                const querySnapshot = await getDocs(q);
                const props = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
                setProperties(props);
            } catch (error) {
                console.error("Error fetching properties:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    return (
        <div className="bg-slate-50 font-display min-h-screen flex flex-col pt-24 pb-20"> {/* PT-24 to acccount for fixed navbar */}

            {/* Header Text Section */}
            <div className="text-center px-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                    The art of the home.
                </h1>
                <p className="text-lg md:text-xl text-slate-500 font-body tracking-wide">
                    {branding.heroSubtitle || "Discover our exclusive collection of premium estates."}
                </p>
            </div>

            {/* Smart Search Bar - Luxe Style */}
            <div className="max-w-4xl mx-auto w-full px-6 mb-16 relative z-20">
                <div className="bg-white/90 backdrop-blur-xl rounded-full shadow-2xl shadow-slate-200/50 border border-white/50 p-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="flex flex-col md:flex-row items-center gap-0">
                        {/* Location */}
                        <div className="flex-1 w-full md:w-auto relative group">
                            <div className="flex items-center gap-3 px-6 h-14 hover:bg-slate-50 rounded-full transition-colors cursor-text" onClick={() => document.getElementById('luxe-search-input')?.focus()}>
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">location_on</span>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors cursor-pointer mb-0.5">Vị trí</label>
                                    <input
                                        id="luxe-search-input"
                                        type="text"
                                        placeholder="Tìm kiếm khu vực..."
                                        value={locationQuery}
                                        onChange={e => setLocationQuery(e.target.value)}
                                        className="w-full bg-transparent font-display font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-0 border-none p-0 text-base"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-slate-200 hidden md:block"></div>

                        {/* Type */}
                        <div className="flex-1 w-full md:w-auto relative group">
                            <div className="flex items-center gap-3 px-6 h-14 hover:bg-slate-50 rounded-full transition-colors relative">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">domain</span>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors mb-0.5">Loại hình</label>
                                    <div className="font-display font-bold text-slate-800 text-base truncate relative z-0">
                                        Tất cả loại hình
                                    </div>
                                    <select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                                        <option>Tất cả loại hình</option>
                                        <option>Căn hộ cao cấp</option>
                                        <option>Biệt thự</option>
                                        <option>Nhà phố</option>
                                        <option>Penthouse</option>
                                    </select>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-sm">expand_more</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-slate-200 hidden md:block"></div>

                        {/* Price */}
                        <div className="flex-1 w-full md:w-auto relative group">
                            <div className="flex items-center gap-3 px-6 h-14 hover:bg-slate-50 rounded-full transition-colors relative">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">attach_money</span>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors mb-0.5">Mức giá</label>
                                    <div className="font-display font-bold text-slate-800 text-base truncate relative z-0">
                                        Mọi mức giá
                                    </div>
                                    <select className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                                        <option>Mọi mức giá</option>
                                        <option>Dưới 5 Tỷ</option>
                                        <option>5 - 10 Tỷ</option>
                                        <option>10 - 20 Tỷ</option>
                                        <option>Trên 20 Tỷ</option>
                                    </select>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 text-sm">expand_more</span>
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="p-1 w-full md:w-auto">
                            <Link
                                to={`/products?q=${locationQuery}`}
                                className="bg-slate-900 hover:bg-indigo-600 text-white rounded-full px-8 h-14 flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 group w-full md:min-w-[140px]"
                            >
                                <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300 text-2xl">search</span>
                                <span className="font-bold font-display tracking-wide text-lg">Tìm Kiếm</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Image - Wide & Rounded */}
            <div className="max-w-[1400px] mx-auto w-full px-6 mb-24">
                <div className="relative aspect-[21/9] md:aspect-[2.5/1] overflow-hidden rounded-[2.5rem] shadow-2xl">
                    <img
                        src={branding.heroImageUrl || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2000&auto=format&fit=crop"}
                        alt="Luxury Estate"
                        className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-105"
                    />

                    {/* Featured Property Label (Optional Overlay) */}
                    <div className="absolute bottom-10 left-10 md:bottom-16 md:left-16 text-white text-left animate-in fade-in slide-in-from-left-8 delay-300">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Featured Property</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold font-display" style={{ fontFamily: "'Playfair Display', serif" }}>
                            The Glass Pavilion, California
                        </h3>
                    </div>

                    {/* Gradient Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                </div>
            </div>

            {/* Curated Collections */}
            <section className="max-w-[1400px] mx-auto w-full px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Curated Collections</h2>
                        <p className="text-slate-500 font-body max-w-xl">Explore our hand-picked selection of properties designed for the modern lifestyle.</p>
                    </div>
                    <Link to="/products" className="hidden md:flex items-center gap-2 text-primary font-bold text-sm hover:text-primary-dark transition-colors font-body">
                        View All Collections <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="aspect-[4/3] bg-slate-200 animate-pulse rounded-3xl"></div>)
                    ) : (
                        properties.map((item) => (
                            <Link to={`/products/${item.id}`} key={item.id} className="group block cursor-pointer bg-white rounded-[2rem] p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                                <div className="aspect-[4/3] overflow-hidden rounded-[1.5rem] relative mb-6">
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute top-4 right-4 bg-white size-10 flex items-center justify-center rounded-full shadow-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors z-10">
                                        <span className="material-symbols-outlined text-xl">favorite</span>
                                    </div>
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <span className="material-symbols-outlined text-sm text-primary">verified</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">{item.type}</span>
                                    </div>
                                </div>
                                <div className="px-2 pb-2">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 font-display group-hover:text-primary transition-colors">{item.title}</h3>
                                    <p className="text-slate-500 font-body text-sm line-clamp-2 mb-4 leading-relaxed">
                                        {item.location}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <p className="text-lg font-bold text-slate-900 font-body">{item.price}</p>
                                        <span className="text-xs font-medium text-slate-400 group-hover:text-primary transition-colors">View Property</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <div className="mt-12 text-center md:hidden">
                    <Link to="/products" className="inline-flex items-center gap-2 text-primary font-bold text-sm">
                        View All Collections <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                </div>
            </section>

        </div>
    );
};

export default LuxeHome;
