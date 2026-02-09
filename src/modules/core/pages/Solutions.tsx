
import React from 'react';
import { Link } from 'react-router-dom';

const Solutions: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-accent-light/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-4 py-1.5 text-xs font-bold text-accent mb-6">
            <span className="material-symbols-outlined text-sm">biotech</span>
            <span>Nghiên cứu & Phát triển Chuyên sâu</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl mb-6 leading-tight">
            Giải Pháp R&D <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Khoa Học & Thực Tiễn</span>
          </h1>
          <p className="text-xl leading-relaxed text-slate-600 mb-10 max-w-2xl mx-auto">
            Kết nối ý tưởng kinh doanh với chuyên môn hóa sinh sâu sắc. Chúng tôi biến các khái niệm phức tạp thành công thức sản phẩm an toàn và hiệu quả.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-bold text-white transition-all hover:bg-primary-dark shadow-lg shadow-primary/25 hover:translate-y-[-2px]">
              <span className="material-symbols-outlined text-xl">handshake</span>
              Liên Hệ Hợp Tác
            </Link>
            <button className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-8 text-base font-bold text-primary transition-all hover:border-accent hover:text-accent">
              Xem hồ sơ năng lực
            </button>
          </div>
        </div>
      </section>

      {/* Why R&D Section */}
      <section className="py-20 bg-white border-b border-accent-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative overflow-hidden rounded-2xl shadow-xl aspect-video">
              <img src="https://picsum.photos/1200/800?random=60" className="object-cover w-full h-full" alt="Lab Process" />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl mb-6">
                Tại sao R&D chuyên nghiệp là <span className="text-accent">chìa khóa thành công</span>?
              </h2>
              <div className="space-y-6 text-slate-600">
                <p className="text-lg leading-relaxed">Trong thị trường đầy cạnh tranh, công thức độc quyền và minh bạch khoa học là tài sản quý giá nhất của thương hiệu.</p>
                <div className="grid sm:grid-cols-2 gap-6 mt-4">
                  {[
                    { icon: 'verified_user', title: 'Minh Bạch Tuyệt Đối', desc: 'Dữ liệu thử nghiệm rõ ràng.' },
                    { icon: 'shield', title: 'An Toàn & Pháp Lý', desc: 'Tuân thủ tiêu chuẩn y tế & GMP.' },
                    { icon: 'trending_up', title: 'Giá Trị Lâu Dài', desc: 'Sản phẩm có vòng đời dài.' },
                    { icon: 'psychology', title: 'Đổi Mới Sáng Tạo', desc: 'Ứng dụng công nghệ mới nhất.' },
                  ].map((f, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="material-symbols-outlined text-accent shrink-0">{f.icon}</span>
                      <div>
                        <h4 className="font-bold text-primary">{f.title}</h4>
                        <p className="text-sm mt-1">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Solutions */}
      <section className="py-24 bg-accent-light/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-accent font-bold uppercase tracking-wider text-sm mb-2 block">Dịch vụ cốt lõi</span>
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Các Giải Pháp R&D Toàn Diện</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'biotech', title: 'Nghiên Cứu & Chuyển Giao', points: ['Phát triển công thức độc quyền', 'Kiểm nghiệm độ ổn định & vi sinh', 'Chuyển giao quy trình sản xuất'] },
              { icon: 'science', title: 'Tư Vấn Hóa Sinh', points: ['Phân tích thành phần chuyên sâu', 'Cải tiến hiệu quả sản phẩm cũ', 'Tư vấn tuân thủ quy định'] },
              { icon: 'handshake', title: 'Hợp Tác Kinh Doanh', points: ['Đối tác chiến lược dài hạn', 'Đồng sở hữu trí tuệ (IP)', 'Hỗ trợ kỹ thuật trọn đời'] },
            ].map((s, idx) => (
              <div key={idx} className="group bg-white rounded-2xl p-8 shadow-card hover:shadow-soft transition-all duration-300 border border-slate-100 hover:border-accent/30 relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-light rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-primary text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:bg-accent transition-colors">
                    <span className="material-symbols-outlined text-3xl">{s.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors">{s.title}</h3>
                  <ul className="space-y-2 mb-6 border-t border-slate-100 pt-4">
                    {s.points.map((p, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="material-symbols-outlined text-accent text-lg">check_circle</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model Working Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Mô Hình Làm Việc R&D</h2>
            <p className="mt-4 text-lg text-slate-600">Quy trình 5 bước tinh gọn, đúng tiến độ thị trường.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-100 z-0"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {[
                { n: '1. Nghiên Cứu', icon: 'manage_search', desc: 'Phân tích xu hướng.' },
                { n: '2. Phân Tích', icon: 'science', desc: 'Đánh giá tính khả thi.' },
                { n: '3. Tối Ưu Hóa', icon: 'tune', desc: 'Điều chỉnh hiệu suất.' },
                { n: '4. Xác Nhận', icon: 'verified', desc: 'Kiểm nghiệm lâm sàng.' },
                { n: '5. Ứng Dụng', icon: 'rocket_launch', desc: 'Chuyển giao thương mại.' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-accent-light flex items-center justify-center mb-6 shadow-sm group-hover:border-accent group-hover:scale-110 transition-all duration-300">
                    <span className="material-symbols-outlined text-3xl text-primary group-hover:text-accent transition-colors">{step.icon}</span>
                  </div>
                  <h4 className="text-lg font-bold text-primary mb-2">{step.n}</h4>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-20 bg-accent-light/20 border-t border-accent-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-primary text-center mb-12">Đối Tượng Phục Vụ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { icon: 'lightbulb', title: 'Startup Founders', desc: 'Biến ý tưởng thành sản phẩm mẫu nhanh chóng.' },
              { icon: 'storefront', title: 'Brand Owners', desc: 'Mở rộng danh mục sản phẩm độc quyền.' },
              { icon: 'factory', title: 'OEM Partners', desc: 'Nâng cao năng lực cạnh tranh kỹ thuật.' },
              { icon: 'monetization_on', title: 'Investors', desc: 'Đánh giá tiềm năng và tính khả thi dự án.' },
            ].map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-accent-light hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-accent-light rounded-lg flex items-center justify-center mb-4 text-primary">
                  <span className="material-symbols-outlined">{t.icon}</span>
                </div>
                <h3 className="font-bold text-lg text-primary mb-2">{t.title}</h3>
                <p className="text-sm text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-primary py-20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Bắt đầu dự án R&D của bạn ngay hôm nay</h2>
          <div className="mt-10 flex justify-center gap-4">
            <Link to="/contact" className="rounded-lg bg-white px-8 py-3.5 text-base font-bold text-primary shadow-lg transition-all hover:bg-accent-light hover:shadow-xl hover:-translate-y-1">
              Liên Hệ Hợp Tác
            </Link>
            <button className="rounded-lg border border-white/30 bg-primary-dark/50 px-8 py-3.5 text-base font-bold text-white transition-all hover:bg-primary-dark backdrop-blur-sm">Xem quy trình chi tiết</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Solutions;
