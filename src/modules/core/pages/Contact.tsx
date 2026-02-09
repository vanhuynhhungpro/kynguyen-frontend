
import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { BRAND_HERO_IMAGE } from '../../../services/ImageAssets';
import { useBranding } from '../../../contexts/BrandingContext';

const Contact: React.FC = () => {
  const { tenantId } = useBranding();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    interest: '',
    message: '',
    agree: false
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agree) {
      setError('Vui lòng đồng ý với chính sách bảo mật trước khi gửi.');
      return;
    }

    if (!tenantId) {
      setError('Không xác định được Tenant. Vui lòng tải lại trang.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const inquiryRef = await addDoc(collection(db, 'inquiries'), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        interest: formData.interest,
        message: formData.message,
        status: 'new',
        createdAt: serverTimestamp(),
        tenantId: tenantId // Add tenantId
      });

      // Tự động tạo Lead trong CRM
      try {
        await addDoc(collection(db, 'customers'), {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company || 'Cá nhân',
          address: '',
          type: formData.company ? 'enterprise' : 'individual',
          status: 'potential',
          pipelineStage: 'new',
          notes: `[Yêu cầu tư vấn] Nhu cầu: ${formData.interest} | Ngân sách: ${formData.company} | Nội dung: ${formData.message}`,
          source: 'contact_form',
          inquiryId: inquiryRef.id,
          createdAt: serverTimestamp(),
          tenantId: tenantId // Add tenantId
        });
      } catch (crmError) {
        console.error("Error syncing to CRM:", crmError);
      }
      setSubmitted(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        interest: '',
        message: '',
        agree: false
      });
    } catch (err: any) {
      console.error("Error adding document: ", err);
      setError('Đã có lỗi xảy ra khi kết nối với server. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-primary py-20 md:py-32 overflow-hidden text-left">
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3FA796 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary via-primary/90 to-transparent"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-6">
              <span className="material-symbols-outlined text-sm text-accent">headset_mic</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-accent-light">Hỗ trợ 24/7</span>
            </div>
            <h1 className="text-white text-4xl md:text-6xl font-black font-display leading-tight tracking-tight mb-6">
              Kết Nối Với <br /><span className="text-accent">Chuyên Gia Bất Động Sản</span>
            </h1>
            <p className="text-accent-light/70 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
              Hãy để LUCE LAND đồng hành cùng bạn tìm kiếm ngôi nhà mơ ước và cơ hội đầu tư sinh lời bền vững.
            </p>
          </div>
          <div className="hidden lg:block w-full max-w-md h-80 rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-white/5 rotate-3 bg-primary-dark/20">
            {/* Cập nhật ảnh BRAND_HERO_IMAGE vào đây */}
            <img alt="Real Estate" className="w-full h-full object-cover opacity-90" src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow bg-white py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 text-left">

            {/* Left Column: Contact Info */}
            <div id="contact-info" className="lg:col-span-5 space-y-12 scroll-mt-24">
              <div>
                <h2 className="text-3xl font-black font-display text-primary uppercase tracking-tight mb-4">Thông Tin Liên Hệ</h2>
                <p className="text-slate-500 text-lg font-medium leading-relaxed">
                  Đội ngũ chuyên viên của chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc về thị trường bất động sản.
                </p>
              </div>
              <div className="space-y-6">
                {[
                  { icon: 'apartment', title: 'Văn Phòng Giao Dịch', desc: 'Tòa nhà Luce Tower, Quận 1, TP. Hồ Chí Minh' },
                  { icon: 'mail', title: 'Email Hỗ Trợ', val: 'contact@luceland.vn', sub: 'Phản hồi trong vòng 24h làm việc' },
                  { icon: 'support_agent', title: 'Hotline Tư Vấn', val: '1900 6868', sub: 'Thứ 2 - Thứ 6 (8:00 - 17:30)' },
                ].map((item, idx) => (
                  <div key={item.icon} className="flex items-start gap-6 p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                    <div className="flex-shrink-0 size-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-primary font-black font-display text-lg mb-1 uppercase tracking-tight">{item.title}</h3>
                      {item.desc && <p className="text-slate-600 font-medium leading-relaxed">{item.desc}</p>}
                      {item.val && <p className="text-primary font-black text-xl">{item.val}</p>}
                      {item.sub && <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{item.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-card border border-slate-100 relative">
                <div className="absolute -top-6 -right-6 size-24 bg-accent/10 rounded-full blur-2xl"></div>

                <h3 className="text-2xl font-black font-display text-primary mb-10 uppercase tracking-tight">Gửi Yêu Cầu Tư Vấn</h3>

                {submitted ? (
                  <div className="py-12 text-center animate-in zoom-in-95 duration-500">
                    <div className="inline-flex size-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-6 shadow-inner">
                      <span className="material-symbols-outlined text-5xl">check_circle</span>
                    </div>
                    <h4 className="text-2xl font-black text-primary mb-2 uppercase font-display">Cảm ơn bạn!</h4>
                    <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi qua email/số điện thoại trong vòng 24 giờ.</p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-all shadow-lg"
                    >
                      Gửi yêu cầu khác
                    </button>
                  </div>
                ) : (
                  <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên <span className="text-rose-500">*</span></label>
                        <input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          className="w-full h-12 px-5 rounded-xl border-none bg-slate-50 text-primary font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none"
                          placeholder="Ho tên của bạn"
                          type="text"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email công việc <span className="text-rose-500">*</span></label>
                        <input
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full h-12 px-5 rounded-xl border-none bg-slate-50 text-primary font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none"
                          placeholder="email@company.com"
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại <span className="text-rose-500">*</span></label>
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full h-12 px-5 rounded-xl border-none bg-slate-50 text-primary font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none"
                          placeholder="09xx xxx xxx"
                          type="tel"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhu cầu quan tâm</label>
                        <select
                          name="interest"
                          value={formData.interest}
                          onChange={handleChange}
                          className="w-full h-12 px-5 rounded-xl border-none bg-slate-50 text-primary font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none cursor-pointer"
                        >
                          <option value="">Chọn nhu cầu...</option>
                          <option value="buy">Mua nhà ở / Đầu tư</option>
                          <option value="rent">Thuê bất động sản</option>
                          <option value="consign">Ký gửi nhà đất</option>
                          <option value="consult">Tư vấn pháp lý</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngân sách dự kiến</label>
                      <input
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full h-12 px-5 rounded-xl border-none bg-slate-50 text-primary font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all outline-none"
                        placeholder="VD: 5 - 10 Tỷ"
                        type="text"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung cần tư vấn <span className="text-rose-500">*</span></label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="w-full p-5 rounded-2xl border-none bg-slate-50 text-primary font-bold text-sm focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all min-h-[120px] outline-none resize-none"
                        placeholder="Tôi đang quan tâm đến dự án căn hộ tại Quận 9..."
                      ></textarea>
                    </div>

                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {error}
                      </div>
                    )}

                    <div className="pt-4 space-y-6">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center pt-0.5">
                          <input
                            name="agree"
                            type="checkbox"
                            checked={formData.agree}
                            onChange={handleChange}
                            className="peer h-5 w-5 rounded border-slate-200 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-600 transition-colors">
                          Tôi xác nhận thông tin cung cấp là chính xác và đồng ý với <a className="text-primary font-bold hover:underline" href="#/privacy">Chính sách bảo mật</a> của LUCE LAND.
                        </span>
                      </label>

                      <button
                        disabled={loading}
                        className={`group flex w-full items-center justify-center gap-3 h-14 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {loading ? (
                          <span className="animate-spin material-symbols-outlined">progress_activity</span>
                        ) : (
                          <>
                            <span>Gửi yêu cầu ngay</span>
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Map Section */}
      <section className="w-full h-[500px] bg-slate-100 relative group overflow-hidden border-t border-slate-100">
        <img alt="Location Map" className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-1000" src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1600" />
        <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="size-20 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl animate-bounce border-4 border-accent-light">
            <span className="material-symbols-outlined text-4xl text-primary filled-icon">location_on</span>
          </div>
          <div className="mt-6 px-8 py-3 bg-primary text-white rounded-2xl shadow-2xl">
            <p className="font-black font-display text-sm tracking-widest uppercase">VĂN PHÒNG LUCE LAND</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
