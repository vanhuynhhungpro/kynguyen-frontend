
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const TermsOfUse: React.FC = () => {
  const navigate = useNavigate();
  const [contactInfo, setContactInfo] = useState({
    email: 'partners@lucebiotech.com',
    website: 'www.lucebiotech.com'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const unsubscribe = onSnapshot(doc(db, 'settings', 'contact_info'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setContactInfo({
          email: data.email || 'partners@lucebiotech.com',
          website: window.location.origin
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const sections = [
    {
      id: "1",
      title: "Phạm vi áp dụng",
      content: "Điều khoản sử dụng này áp dụng cho toàn bộ người dùng truy cập, sử dụng hoặc tương tác với website của LUCE BIO TECH, bao gồm nhưng không giới hạn:",
      items: [
        "Truy cập nội dung tin tức, nghiên cứu",
        "Sử dụng công cụ, dữ liệu, phân tích (nếu có)",
        "Gửi biểu mẫu liên hệ, đăng ký",
        "Tải hoặc tham khảo tài liệu"
      ]
    },
    {
      id: "2",
      title: "Mục đích website",
      content: "Website LUCE BIO TECH được xây dựng nhằm:",
      items: [
        "Cung cấp thông tin khoa học, nghiên cứu và xu hướng công nghệ sinh học",
        "Giới thiệu hoạt động R&D, định hướng công nghệ",
        "Hỗ trợ kết nối và trao đổi thông tin với đối tác, khách hàng"
      ],
      note: "Website không phải là nền tảng bán lẻ sản phẩm và không thay thế tư vấn y tế, pháp lý hoặc chuyên môn."
    },
    {
      id: "3",
      title: "Quyền và nghĩa vụ của người dùng",
      subsections: [
        {
          subtitle: "Người dùng cam kết:",
          items: [
            "Sử dụng website cho mục đích hợp pháp",
            "Không sao chép, chỉnh sửa, phát tán nội dung vì mục đích thương mại khi chưa có sự cho phép bằng văn bản",
            "Không can thiệp, phá hoại hệ thống, dữ liệu hoặc chức năng website",
            "Không đăng tải hoặc gửi nội dung sai sự thật, gây hiểu nhầm hoặc vi phạm pháp luật"
          ]
        },
        {
          subtitle: "LUCE BIO TECH có quyền:",
          items: [
            "Từ chối hoặc chấm dứt quyền truy cập của người dùng vi phạm điều khoản",
            "Thay đổi, cập nhật hoặc ngừng cung cấp một phần hoặc toàn bộ website mà không cần thông báo trước"
          ]
        }
      ]
    },
    {
      id: "4",
      title: "Quyền sở hữu trí tuệ",
      content: "Toàn bộ nội dung trên website (bao gồm nhưng không giới hạn: văn bản, hình ảnh, biểu đồ, dữ liệu, thiết kế, logo, tài liệu R&D) thuộc quyền sở hữu của LUCE BIO TECH hoặc các bên cấp phép hợp pháp.",
      subsections: [
        {
          subtitle: "Người dùng chỉ được:",
          items: [
            "Xem và tham khảo cho mục đích cá nhân, nghiên cứu, học tập",
            "Trích dẫn nội dung với điều kiện ghi rõ nguồn LUCE BIO TECH"
          ]
        }
      ],
      note: "Mọi hình thức sử dụng cho mục đích thương mại phải có sự đồng ý bằng văn bản của chúng tôi."
    },
    {
      id: "5",
      title: "Nội dung khoa học và tuyên bố miễn trừ",
      content: "Các thông tin khoa học, nghiên cứu, phân tích trên website:",
      items: [
        "Mang tính chất tham khảo, giáo dục và định hướng",
        "Không cấu thành tư vấn y tế, chẩn đoán, điều trị hoặc tư vấn pháp lý",
        "Không thay thế ý kiến của chuyên gia, bác sĩ hoặc cơ quan có thẩm quyền"
      ],
      note: "LUCE BIO TECH không chịu trách nhiệm đối với các quyết định hoặc hành động được thực hiện dựa trên thông tin từ website."
    },
    {
      id: "6",
      title: "Liên kết bên thứ ba",
      content: "Website có thể chứa liên kết đến website hoặc dịch vụ của bên thứ ba. LUCE BIO TECH không kiểm soát và không chịu trách nhiệm về nội dung, chính sách hoặc hoạt động của các bên thứ ba này. Việc truy cập các liên kết bên ngoài là trách nhiệm của người dùng."
    },
    {
      id: "7",
      title: "Bảo mật thông tin",
      content: "Việc thu thập, sử dụng và bảo vệ thông tin cá nhân của người dùng được thực hiện theo Chính sách bảo mật của LUCE BIO TECH, là một phần không tách rời của Điều khoản sử dụng này."
    },
    {
      id: "8",
      title: "Giới hạn trách nhiệm",
      content: "Trong phạm vi pháp luật cho phép:",
      items: [
        "LUCE BIO TECH không chịu trách nhiệm đối với bất kỳ thiệt hại trực tiếp hoặc gián tiếp nào phát sinh từ việc sử dụng hoặc không thể sử dụng website",
        "Chúng tôi không bảo đảm website sẽ hoạt động liên tục, không có lỗi hoặc hoàn toàn chính xác tại mọi thời điểm"
      ]
    },
    {
      id: "9",
      title: "Thay đổi điều khoản",
      content: "LUCE BIO TECH có quyền sửa đổi, cập nhật Điều khoản sử dụng này bất kỳ lúc nào. Phiên bản cập nhật sẽ được đăng tải trên website và có hiệu lực kể từ ngày công bố. Việc bạn tiếp tục sử dụng website sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó."
    },
    {
      id: "10",
      title: "Luật áp dụng",
      content: "Điều khoản sử dụng này được điều chỉnh và giải thích theo pháp luật Việt Nam. Mọi tranh chấp phát sinh (nếu có) sẽ được ưu tiên giải quyết thông qua thương lượng, trong trường hợp cần thiết sẽ đưa ra cơ quan có thẩm quyền theo quy định pháp luật."
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <section className="bg-primary text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3FA796_1px,transparent_1px)] [background-size:32px_32px]"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center text-left">
          <button 
            onClick={() => navigate(-1)} 
            className="mb-8 inline-flex items-center gap-2 text-accent-light/60 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Quay lại
          </button>
          <h1 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tight mb-4">ĐIỀU KHOẢN SỬ DỤNG</h1>
          <p className="text-accent-light/60 font-medium">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </section>

      {/* Content Section */}
      <main className="max-w-4xl mx-auto px-6 py-20 text-left">
        <div className="bg-slate-50/50 rounded-[3rem] p-8 md:p-16 border border-slate-100 shadow-soft">
          <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-primary prose-strong:font-black">
            <p className="text-lg font-medium text-primary mb-12 italic border-l-4 border-accent pl-6">
              Chào mừng bạn đến với website của LUCE BIO TECH (“chúng tôi”). Bằng việc truy cập và sử dụng website này, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các điều khoản sử dụng dưới đây.
            </p>

            <div className="space-y-16">
              {sections.map((section) => (
                <div key={section.id} className="relative">
                  <div className="flex items-start gap-6">
                    <span className="flex-shrink-0 size-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-primary font-black font-display text-xl">
                      {section.id}
                    </span>
                    <div className="flex-1 pt-2">
                      <h2 className="text-2xl font-black text-primary font-display uppercase tracking-tight mb-6">{section.title}</h2>
                      
                      {section.content && <p className="text-slate-600 leading-relaxed text-lg mb-4">{section.content}</p>}
                      
                      {section.items && (
                        <ul className="space-y-3 list-none p-0 mb-6">
                          {section.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-slate-600 font-medium">
                              <span className="material-symbols-outlined text-accent text-xl">check_circle</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}

                      {section.subsections && (
                        <div className="space-y-8 mt-6">
                          {section.subsections.map((sub, idx) => (
                            <div key={idx} className="bg-white/60 p-6 rounded-2xl border border-slate-100">
                              <h3 className="text-lg font-bold text-primary mb-4">{sub.subtitle}</h3>
                              <ul className="space-y-2 list-none p-0">
                                {sub.items.map((item, i) => (
                                  <li key={i} className="flex items-start gap-3 text-sm text-slate-500 font-bold uppercase tracking-wide">
                                    <span className="size-2 rounded-full bg-accent mt-1.5 shrink-0"></span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {section.note && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm font-bold flex items-start gap-3">
                           <span className="material-symbols-outlined text-amber-500">info</span>
                           {section.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Contact Section */}
              <div className="pt-12 border-t border-slate-200">
                <div className="flex items-start gap-6">
                  <span className="flex-shrink-0 size-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black font-display text-xl">
                    11
                  </span>
                  <div className="flex-1 pt-2">
                    <h2 className="text-2xl font-black text-primary font-display uppercase tracking-tight mb-6">Thông tin liên hệ</h2>
                    <p className="text-slate-600 mb-6">Mọi thắc mắc liên quan đến Điều khoản sử dụng, vui lòng liên hệ:</p>
                    
                    <div className="bg-[#0B3C49] text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10">
                          <span className="material-symbols-outlined text-[100px]">gavel</span>
                       </div>
                       <div className="relative z-10 space-y-4">
                          <p className="text-xl font-black font-display tracking-widest uppercase">LUCE BIO TECH</p>
                          <div className="h-px bg-white/20 w-20"></div>
                          <div className="space-y-2">
                             <p className="flex items-center gap-3 text-accent-light/80 font-medium">
                               <span className="material-symbols-outlined text-accent">mail</span>
                               Email: <span className="text-white font-bold">{contactInfo.email}</span>
                             </p>
                             <p className="flex items-center gap-3 text-accent-light/80 font-medium">
                               <span className="material-symbols-outlined text-accent">language</span>
                               Website: <span className="text-white font-bold">{contactInfo.website}</span>
                             </p>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 p-8 border-2 border-slate-100 rounded-[2rem] text-center">
               <h4 className="text-primary font-black uppercase text-sm mb-2 tracking-widest">Lưu ý cuối</h4>
               <p className="text-slate-400 font-medium">Việc truy cập website đồng nghĩa bạn đã đọc, hiểu và đồng ý với toàn bộ Điều khoản sử dụng này.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating CTA */}
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

export default TermsOfUse;
