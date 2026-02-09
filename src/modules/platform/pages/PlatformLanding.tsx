import React from 'react';
import { Link } from 'react-router-dom';
import { generateInvoiceHtml } from '../../../utils/invoiceGenerator';

const PlatformLanding: React.FC = () => {
    const handleCreateInvoice = (planName: string, price: number) => {
        const html = generateInvoiceHtml({ name: planName, price });
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

    const handleConfirmPayment = () => {
        const transactionCode = prompt("Vui lòng nhập mã giao dịch ngân hàng của bạn:");
        if (transactionCode) {
            alert(`Cảm ơn bạn! Hệ thống đã ghi nhận giao dịch ${transactionCode}. Admin sẽ kích hoạt tài khoản trong ít phút.`);
            // TODO: Submit to 'billing_requests' collection in Firestore
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-body text-slate-200 scroll-smooth">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 size-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <span className="material-symbols-outlined text-2xl font-bold">rocket_launch</span>
                        </div>
                        <span className="text-xl font-black text-white tracking-tight font-display uppercase">KyNguyen<span className="text-indigo-400">RealAI</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
                        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Tính Năng</button>
                        <button onClick={() => document.getElementById('why')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Lợi Ích</button>
                        <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Bảng Giá</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all">
                            Đăng Nhập
                        </Link>
                        <Link to="/tenant/register" className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5">
                            Dùng Thử Ngay
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 size-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 size-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        Công Nghệ AI Cho Bất Động Sản
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 animate-in fade-in duration-700 slide-in-from-bottom-8 delay-100">
                        Tạo Website Bất Động Sản <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Chuyên Nghiệp Bằng AI</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 animate-in fade-in duration-700 slide-in-from-bottom-8 delay-200">
                        Sở hữu ngay nền tảng quản lý, bán hàng và chăm sóc khách hàng tự động chỉ trong 30 giây. Không cần biết code.
                    </p>
                    <div className="flex items-center justify-center gap-4 animate-in fade-in duration-700 slide-in-from-bottom-8 delay-300">
                        <Link to="/tenant/register" className="h-14 px-8 rounded-2xl bg-white text-slate-900 font-black text-base hover:bg-slate-100 shadow-xl shadow-white/10 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">auto_fix_high</span>
                            Tạo Website Ngay
                        </Link>
                        <Link to="/login" className="h-14 px-8 rounded-2xl bg-white/10 text-white font-bold text-base hover:bg-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2 border border-white/10">
                            Xem Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-900/50 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Mọi Thứ Bạn Cần Để <span className="text-indigo-400">Bùng Nổ Doanh Số</span></h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Tích hợp đầy đủ công cụ Marketing, Sales và CRM trong một nền tảng duy nhất.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-[2.5rem] bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity bg-indigo-500 blur-3xl rounded-full w-32 h-32 -mr-10 -mt-10"></div>
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 text-3xl">
                                <span className="material-symbols-outlined">edit_square</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">AI Viết Nội Dung</h3>
                            <p className="text-slate-400 leading-relaxed">Tự động viết bài đăng bán BĐS chuẩn SEO, hấp dẫn chỉ với vài từ khóa gợi ý. Không còn bí ý tưởng.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-[2.5rem] bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity bg-purple-500 blur-3xl rounded-full w-32 h-32 -mr-10 -mt-10"></div>
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 text-3xl">
                                <span className="material-symbols-outlined">web</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Landing Page Builder</h3>
                            <p className="text-slate-400 leading-relaxed">Kéo thả để tạo Landing Page dự án tuyệt đẹp. Hỗ trợ Form thu thập Lead đổ về CRM.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-[2.5rem] bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity bg-emerald-500 blur-3xl rounded-full w-32 h-32 -mr-10 -mt-10"></div>
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 text-3xl">
                                <span className="material-symbols-outlined">groups</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">CRM & Chăm Sóc Khách</h3>
                            <p className="text-slate-400 leading-relaxed">Quản lý danh sách khách hàng, lịch sử tươmg tác và tự động nhắc nhở lịch hẹn.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="why" className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
                                <span className="material-symbols-outlined text-sm">steps</span> Qúy Trình Đơn Giản
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">Sở Hữu Website <br /> Trong <span className="text-blue-400">3 Bước Đơn Giản</span></h2>
                            <p className="text-slate-400 text-lg mb-10">Không cần kiến thức lập trình. Không cần thuê đội ngũ thiết kế. Bạn hoàn toàn làm chủ công nghệ.</p>

                            <div className="space-y-8">
                                {[
                                    { step: '01', title: 'Đăng ký tài khoản', desc: 'Điền thông tin doanh nghiệp và chọn tên miền riêng của bạn.' },
                                    { step: '02', title: 'Chọn giao diện', desc: 'Kho giao diện BĐS chuyên nghiệp, tùy chỉnh màu sắc theo thương hiệu.' },
                                    { step: '03', title: 'Bắt đầu kinh doanh', desc: 'Đăng tải dự án, chạy quảng cáo và đón nhận khách hàng tiềm năng.' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-slate-700">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                                            <p className="text-slate-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>
                            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" alt="Dashboard Preview" className="relative rounded-3xl border border-slate-800 shadow-2xl shadow-black/50" />
                            {/* Floating Card */}
                            <div className="absolute -bottom-10 -left-10 bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl max-w-xs hidden md:block">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <span className="material-symbols-outlined">trending_up</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase">Khách hàng mới</p>
                                        <p className="text-xl font-black text-white">+128%</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-3/4 bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Bảng Giá Linh Hoạt</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Chọn gói phù hợp với quy mô doanh nghiệp của bạn. Nâng cấp bất cứ lúc nào.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {/* Plan 1 */}
                        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 hover:border-slate-600 transition-all group">
                            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4">Startup</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-black text-white">499k</span>
                                <span className="text-slate-500">/tháng</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {['1 User quản trị', '50 Bất động sản', 'Giao diện cơ bản', 'Hỗ trợ Email'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                        <span className="material-symbols-outlined text-green-500 text-lg">check</span> {feat}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/tenant/register?plan=startup" className="block w-full py-4 rounded-xl bg-slate-800 text-white font-bold text-center hover:bg-slate-700 transition-all">
                                Chọn Gói Này
                            </Link>
                        </div>

                        {/* Plan 2: POPULAR */}
                        <div className="p-8 rounded-3xl bg-slate-800 border-2 border-indigo-500 relative shadow-2xl shadow-indigo-500/20 transform scale-105 z-10">
                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-widest">Phổ Biến</div>
                            <h3 className="text-lg font-bold text-indigo-400 uppercase tracking-widest mb-4">Growth</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-black text-white">999k</span>
                                <span className="text-indigo-200">/tháng</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {['5 User quản trị', 'Không giới hạn BĐS', 'AI Viết Content (100 bài/tháng)', 'CRM Cơ bản', 'Tên miền riêng', 'Hỗ trợ ưu tiên'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white text-sm font-bold">
                                        <span className="material-symbols-outlined text-indigo-400 text-lg">verified</span> {feat}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/tenant/register?plan=growth" className="block w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-center hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25">
                                Dùng Thử Miễn Phí
                            </Link>
                        </div>

                        {/* Plan 3 */}
                        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 hover:border-slate-600 transition-all group">
                            <h3 className="text-lg font-bold text-purple-400 uppercase tracking-widest mb-4">Business</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-black text-white">2.990k</span>
                                <span className="text-slate-500">/tháng</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {['20 User quản trị', 'AI Content không giới hạn', 'Social Agent (Auto Posting)', 'CRM Nâng cao & Email MKT', 'API Access', '1-1 Onboarding'].map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                        <span className="material-symbols-outlined text-purple-500 text-lg">check</span> {feat}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <Link to="/tenant/register?plan=business" className="flex-1 py-4 rounded-xl bg-purple-600/10 text-purple-400 font-bold text-center hover:bg-purple-600/20 transition-all border border-purple-500/20">
                                        Liên Hệ
                                    </Link>
                                    <button onClick={() => handleCreateInvoice('Business', 2990000)} className="flex-1 py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-all shadow-lg text-sm">
                                        Tạo Hóa Đơn
                                    </button>
                                </div>
                                <button onClick={handleConfirmPayment} className="w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 font-bold hover:text-white hover:border-slate-400 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    Đã Chuyển Khoản
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Khách Hàng Nói Gì?</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { name: 'Nguyễn Văn A', role: 'CEO, Sài Gòn Real', text: 'Từ khi dùng KyNguyenRealAI, đội ngũ sale của tôi tiết kiệm được 50% thời gian đăng tin và chăm sóc khách. Doanh số tăng trưởng rõ rệt.' },
                            { name: 'Trần Thị B', role: 'Giám Đốc Sàn Hà Nội', text: 'Giao diện web rất đẹp và chuyên nghiệp. Khách hàng của tôi ấn tượng ngay từ lần truy cập đầu tiên. Tính năng AI viết bài cực kỳ hữu ích.' },
                            { name: 'Lê Văn C', role: 'Founder, TechLand', text: 'Hệ thống CRM tích hợp giúp tôi không bỏ sót bất kỳ khách hàng nào. Việc quản lý hàng trăm bất động sản trở nên đơn giản hơn bao giờ hết.' },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-3xl">
                                <div className="flex gap-1 text-yellow-500 mb-4">
                                    {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm filled-icon">star</span>)}
                                </div>
                                <p className="text-slate-300 mb-6 leading-relaxed">"{item.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{item.name}</p>
                                        <p className="text-slate-500 text-xs">{item.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-slate-900/50">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Câu Hỏi Thường Gặp</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            { q: 'Tôi có cần biết lập trình để sử dụng không?', a: 'Hoàn toàn không. Mọi thao tác đều được thiết kế kéo-thả trực quan, đơn giản như sử dụng Facebook.' },
                            { q: 'Dữ liệu của tôi có được bảo mật không?', a: 'Dữ liệu của mỗi khách hàng được mã hóa và lưu trữ độc lập (Tenant Isolation). Chúng tôi cam kết bảo mật tuyệt đối thông tin kinh doanh của bạn.' },
                            { q: 'Tôi có thể nâng cấp gói sau này không?', a: 'Có, bạn có thể nâng cấp gói dịch vụ bất cứ lúc nào ngay trong trang quản trị. Dữ liệu sẽ được giữ nguyên.' },
                        ].map((item, i) => (
                            <details key={i} className="group bg-slate-800/50 rounded-2xl border border-slate-700/50 open:bg-slate-800 transition-all">
                                <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-white list-none">
                                    {item.q}
                                    <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-slate-400">expand_more</span>
                                </summary>
                                <div className="px-6 pb-6 text-slate-400 leading-relaxed">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-8">Sẵn Sàng Để <br /> Thay Đổi Cách Bán Bất Động Sản?</h2>
                    <Link to="/tenant/register" className="inline-flex h-16 px-10 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-500 shadow-xl shadow-indigo-500/30 transition-all items-center gap-3">
                        Bắt Đầu Ngay Hôm Nay
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                    <p className="mt-6 text-slate-500 font-medium">14 Ngày dùng thử miễn phí • Không cần thẻ tín dụng</p>
                </div>

                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-slate-900 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <span className="material-symbols-outlined text-xl">rocket_launch</span>
                        <span className="font-bold text-lg">KyNguyenRealAI</span>
                    </div>
                    <p className="text-slate-600 text-sm">© 2024 KyNguyenRealAI. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PlatformLanding;
