
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';

const Home: React.FC = () => {
  const { currentUser } = useAuth();
  const { branding } = useBranding();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-24 lg:pb-32 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col gap-6 max-w-2xl text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Đối tác Bất động sản Tin cậy</span>
              </div>
              <div className="space-y-1">
                <p className="font-display text-xl font-semibold text-primary/80 uppercase tracking-wide">
                  {branding.companyName || 'Bất Động Sản Cao Cấp'}
                </p>
                <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                  {branding.companyName ? `Không Gian Sống.` : 'Tìm Kiếm.'} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                    {branding.companyName ? `Đẳng Cấp Của Bạn` : 'Ngôi Nhà Mơ Ước.'}
                  </span>
                </h1>
              </div>
              <p className="text-lg leading-relaxed text-slate-600 max-w-lg">
                Chúng tôi cung cấp những dự án bất động sản tốt nhất, pháp lý minh bạch và tiềm năng sinh lời cao.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/products" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-white transition-all hover:bg-primary-dark shadow-lg shadow-primary/25 hover:translate-y-[-1px]">
                  <span className="material-symbols-outlined text-xl">search</span>
                  Xem Dự Án
                </Link>
                <Link to="/contact" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-slate-200 px-8 text-base font-bold text-slate-600 transition-all hover:border-primary hover:text-primary hover:bg-white">
                  Liên Hệ Ngay
                </Link>
              </div>

              <div className="flex items-center gap-4 pt-4 text-sm text-slate-500">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="size-9 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-400 shadow-sm overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p className="font-medium">Được tin cậy bởi <span className="font-bold text-primary">1,000+ Khách hàng</span></p>
              </div>
            </div>

            <div className="relative lg:ml-auto">
              <div className="absolute -right-20 -top-20 -z-10 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl opacity-60"></div>
              <div className="absolute -bottom-10 -left-10 -z-10 h-[300px] w-[300px] rounded-full bg-accent/10 blur-3xl"></div>

              <div className="relative rounded-2xl bg-white p-2 shadow-2xl shadow-slate-200 ring-1 ring-slate-100 overflow-hidden">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1600596542815-22b4899975d6?auto=format&fit=crop&q=80&w=2000"
                    alt="Property"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 items-center justify-center">
            <div className="flex flex-col items-center gap-1 text-center group">
              <span className="text-3xl font-bold text-primary group-hover:text-accent transition-colors">500+</span>
              <span className="text-sm text-slate-500">Bất động sản</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center group">
              <span className="text-3xl font-bold text-primary group-hover:text-accent transition-colors">10k+</span>
              <span className="text-sm text-slate-500">Khách hàng</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center group">
              <span className="text-3xl font-bold text-primary group-hover:text-accent transition-colors">50+</span>
              <span className="text-sm text-slate-500">Đối tác phân phối</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center group">
              <span className="text-3xl font-bold text-primary group-hover:text-accent transition-colors">24/7</span>
              <span className="text-sm text-slate-500">Hỗ trợ tư vấn</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
