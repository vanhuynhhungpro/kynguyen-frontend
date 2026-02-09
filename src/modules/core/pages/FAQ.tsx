
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "1. LUCE BIO TECH là đơn vị hoạt động trong lĩnh vực gì?",
      answer: "LUCE BIO TECH là đơn vị nghiên cứu và phát triển (R&D) trong lĩnh vực công nghệ sinh học, mỹ phẩm và sức khỏe, tập trung vào việc ứng dụng khoa học hiện đại để khai thác và tối ưu giá trị của các hoạt chất sinh học một cách an toàn, bền vững và minh bạch."
    },
    {
      question: "2. LUCE BIO TECH có trực tiếp sản xuất và bán sản phẩm không?",
      answer: (
        <div className="space-y-4">
          <p>LUCE BIO TECH không tập trung vào bán lẻ đại trà. Chúng tôi hoạt động chủ yếu trong các mảng:</p>
          <ul className="list-none space-y-2">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Nghiên cứu & phát triển công thức</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Tư vấn R&D, công nghệ và nguyên liệu</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Hợp tác phát triển sản phẩm với thương hiệu và đối tác</li>
          </ul>
          <p className="italic text-slate-500">Việc thương mại hóa sản phẩm phụ thuộc vào từng dự án hợp tác cụ thể.</p>
        </div>
      )
    },
    {
      question: "3. Thông tin khoa học trên website có đáng tin cậy không?",
      answer: (
        <div className="space-y-4">
          <p>Nội dung trên website được xây dựng dựa trên:</p>
          <ul className="list-none space-y-2">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Tài liệu khoa học công bố</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Dữ liệu nghiên cứu và phân tích chuyên môn</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Kinh nghiệm R&D thực tế</li>
          </ul>
          <p className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
            <strong>Lưu ý:</strong> Các thông tin này chỉ mang tính tham khảo khoa học, không thay thế cho tư vấn y tế, pháp lý hoặc chẩn đoán chuyên môn.
          </p>
        </div>
      )
    },
    {
      question: "4. LUCE BIO TECH có cung cấp dịch vụ R&D theo yêu cầu không?",
      answer: (
        <div className="space-y-4">
          <p>Có. Chúng tôi cung cấp các hình thức hợp tác R&D như:</p>
          <ul className="list-none space-y-2">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Nghiên cứu hoạt chất và công nghệ bào chế</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Phát triển công thức mỹ phẩm hoặc sản phẩm chăm sóc sức khỏe</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Đánh giá xu hướng và tiềm năng công nghệ sinh học</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Tư vấn cải tiến hoặc tối ưu sản phẩm hiện có</li>
          </ul>
          <p>Vui lòng liên hệ trực tiếp để trao đổi chi tiết về nhu cầu cụ thể.</p>
        </div>
      )
    },
    {
      question: "5. LUCE BIO TECH có nhận hợp tác với startup hoặc thương hiệu mới không?",
      answer: (
        <div className="space-y-4">
          <p>Có. LUCE BIO TECH khuyến khích hợp tác với:</p>
          <ul className="list-none space-y-2">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Startup trong lĩnh vực mỹ phẩm, chăm sóc sức khỏe</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Thương hiệu đang tìm hướng đi khoa học và khác biệt</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Đơn vị cần hỗ trợ chuyên môn R&D và chiến lược công nghệ</li>
          </ul>
          <p>Mỗi dự án sẽ được đánh giá dựa trên tính khả thi, định hướng dài hạn và giá trị khoa học.</p>
        </div>
      )
    },
    {
      question: "6. Các công nghệ như Nano, Liposomal, Encapsulation trên website có phải là công nghệ độc quyền không?",
      answer: "Một số công nghệ được đề cập là xu hướng và nền tảng chung trong ngành, một số khác là giải pháp được LUCE BIO TECH nghiên cứu, điều chỉnh hoặc ứng dụng riêng theo từng dự án. Thông tin chi tiết về tính độc quyền hoặc phạm vi ứng dụng sẽ được trao đổi trong khuôn khổ hợp tác chính thức."
    },
    {
      question: "7. LUCE BIO TECH có công bố dữ liệu nghiên cứu nội bộ không?",
      answer: "Các dữ liệu nội bộ, báo cáo R&D và kết quả nghiên cứu chi tiết không được công bố công khai vì lý do bảo mật và quyền sở hữu trí tuệ. Website chỉ chia sẻ các nội dung tổng quan, mang tính định hướng và giáo dục."
    },
    {
      question: "8. Website có sử dụng AI hoặc công cụ phân tích dữ liệu không?",
      answer: (
        <div className="space-y-4">
          <p>Website và hệ thống nội bộ của LUCE BIO TECH có thể sử dụng công cụ phân tích dữ liệu và AI nhằm:</p>
          <ul className="list-none space-y-2">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Phân tích xu hướng thị trường</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Hỗ trợ nghiên cứu và tổng hợp thông tin</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Cải thiện trải nghiệm người dùng</li>
          </ul>
          <p>Mọi dữ liệu cá nhân (nếu có) đều được xử lý theo Chính sách bảo mật của chúng tôi.</p>
        </div>
      )
    },
    {
      question: "9. Tôi có thể sử dụng nội dung trên website cho mục đích nghiên cứu hoặc đào tạo không?",
      answer: "Bạn có thể trích dẫn nội dung cho mục đích nghiên cứu, học tập hoặc tham khảo với điều kiện ghi rõ nguồn LUCE BIO TECH. Mọi hình thức sao chép, sử dụng cho mục đích thương mại cần có sự đồng ý bằng văn bản từ chúng tôi."
    },
    {
      question: "10. Làm thế nào để liên hệ hoặc đề xuất hợp tác với LUCE BIO TECH?",
      answer: (
        <div className="space-y-4">
          <p>Bạn có thể:</p>
          <ul className="list-none space-y-2">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Gửi email qua địa chỉ liên hệ trên website</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Điền biểu mẫu liên hệ</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent"></span> Gửi đề xuất hợp tác kèm mô tả ngắn về dự án hoặc nhu cầu</li>
          </ul>
          <p>Đội ngũ của chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-primary text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3FA796_1px,transparent_1px)] [background-size:32px_32px]"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 mb-6">
             <span className="material-symbols-outlined text-sm text-accent">help</span>
             <span className="text-[10px] font-black uppercase tracking-widest text-accent-light">Trung tâm giải đáp</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tight mb-4">CÂU HỎI THƯỜNG GẶP</h1>
          <p className="text-accent-light/60 font-medium max-w-xl mx-auto">Mọi thông tin bạn cần biết về LUCE BIO TECH và quy trình hợp tác R&D chuyên sâu.</p>
        </div>
      </section>

      {/* FAQ Content */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`rounded-[2rem] border transition-all duration-300 ${openIndex === index ? 'bg-white border-primary shadow-soft' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left"
              >
                <span className={`text-lg font-bold font-display transition-colors ${openIndex === index ? 'text-primary' : 'text-slate-700'}`}>
                  {faq.question}
                </span>
                <span className={`material-symbols-outlined transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-primary' : 'text-slate-400'}`}>
                  expand_more
                </span>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-8 pb-8 text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-6">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-20 p-8 bg-primary-dark text-white rounded-[3rem] shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[120px]">science</span>
           </div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                 <h3 className="text-xl font-black font-display uppercase tracking-tight mb-2">Bạn vẫn còn thắc mắc?</h3>
                 <p className="text-accent-light/60 font-medium">Đội ngũ chuyên gia của chúng tôi sẵn sàng hỗ trợ bạn qua email hoặc hotline.</p>
              </div>
              <button 
                onClick={() => navigate('/contact')}
                className="px-8 h-14 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-primary transition-all shadow-lg active:scale-95 whitespace-nowrap"
              >
                Gửi câu hỏi ngay
              </button>
           </div>
        </div>

        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
           <span className="material-symbols-outlined text-slate-400 text-2xl">info</span>
           <p className="text-xs text-slate-500 italic leading-relaxed">
             <strong>Lưu ý:</strong> LUCE BIO TECH hoạt động theo định hướng khoa học và minh bạch. Chúng tôi không đưa ra cam kết điều trị, chẩn đoán y tế hoặc bảo đảm hiệu quả thương mại nếu chưa có đánh giá và thỏa thuận chính thức bằng văn bản.
           </p>
        </div>
      </main>

      {/* Floating Back to Top */}
      <div className="fixed bottom-10 right-10 z-50">
         <button 
           onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
           className="size-14 bg-white border border-slate-200 rounded-full shadow-2xl flex items-center justify-center text-primary hover:bg-slate-50 transition-all active:scale-90"
         >
           <span className="material-symbols-outlined">arrow_upward</span>
         </button>
      </div>
    </div>
  );
};

export default FAQ;
