
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PrivacyPolicy: React.FC = () => {
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
      content: "Chính sách bảo mật này áp dụng cho toàn bộ người dùng truy cập và tương tác với website của LUCE BIO TECH, bao gồm nhưng không giới hạn: Đọc nội dung tin tức, nghiên cứu; Gửi biểu mẫu liên hệ; Đăng ký nhận bản tin; Sử dụng các công cụ phân tích xu hướng, dữ liệu hoặc AI (nếu có)."
    },
    {
      id: "2",
      title: "Thông tin chúng tôi thu thập",
      subsections: [
        {
          subtitle: "2.1. Thông tin bạn chủ động cung cấp",
          items: ["Họ tên", "Địa chỉ email", "Số điện thoại", "Nội dung bạn gửi qua biểu mẫu liên hệ hoặc đăng ký", "Thông tin tổ chức/doanh nghiệp (nếu có)"]
        },
        {
          subtitle: "2.2. Thông tin thu thập tự động",
          text: "Khi bạn truy cập website, một số dữ liệu có thể được thu thập tự động, bao gồm: Địa chỉ IP, Loại trình duyệt và thiết bị, Thời gian truy cập, trang đã xem, Dữ liệu cookies và công nghệ tương tự. Những dữ liệu này không dùng để định danh cá nhân cụ thể, mà phục vụ mục đích phân tích, cải thiện trải nghiệm và hiệu suất website."
        }
      ]
    },
    {
      id: "3",
      title: "Mục đích sử dụng thông tin",
      items: [
        "Cung cấp và vận hành website",
        "Phản hồi yêu cầu, câu hỏi hoặc liên hệ từ người dùng",
        "Gửi thông tin cập nhật, bản tin khoa học (khi bạn đăng ký)",
        "Phân tích xu hướng sử dụng để cải thiện nội dung và dịch vụ",
        "Đảm bảo an ninh, ngăn chặn gian lận và truy cập trái phép"
      ]
    },
    {
      id: "4",
      title: "Lưu trữ và bảo mật thông tin",
      content: "Thông tin cá nhân được lưu trữ trên hệ thống có biện pháp bảo mật phù hợp. Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức nhằm bảo vệ dữ liệu khỏi truy cập trái phép, mất mát hoặc rò rỉ. Thông tin chỉ được lưu trữ trong thời gian cần thiết cho mục đích đã nêu, trừ khi pháp luật yêu cầu thời gian lưu trữ dài hơn."
    },
    {
      id: "5",
      title: "Chia sẻ thông tin với bên thứ ba",
      content: "LUCE BIO TECH không bán, cho thuê hoặc trao đổi thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại. Chúng tôi chỉ có thể chia sẻ thông tin trong các trường hợp: Có sự đồng ý rõ ràng của bạn; Theo yêu cầu của cơ quan nhà nước có thẩm quyền; Với đối tác kỹ thuật (như nhà cung cấp hạ tầng, phân tích dữ liệu) nhưng chỉ trong phạm vi cần thiết và có ràng buộc bảo mật."
    },
    {
      id: "6",
      title: "Cookies và công nghệ theo dõi",
      content: "Website có thể sử dụng cookies để: Ghi nhớ tùy chọn người dùng, Phân tích lưu lượng truy cập, Cải thiện hiệu suất và trải nghiệm. Bạn có thể tắt cookies trong cài đặt trình duyệt. Tuy nhiên, một số chức năng của website có thể không hoạt động tối ưu."
    },
    {
      id: "7",
      title: "Quyền của người dùng",
      content: "Bạn có quyền: Yêu cầu truy cập, chỉnh sửa hoặc cập nhật thông tin cá nhân của mình; Yêu cầu ngừng nhận thông tin email (unsubscribe); Yêu cầu xóa dữ liệu cá nhân, trong phạm vi pháp luật cho phép."
    },
    {
      id: "8",
      title: "Bảo mật thông tin trẻ em",
      content: "Website không hướng đến đối tượng trẻ em dưới 16 tuổi và chúng tôi không cố ý thu thập thông tin cá nhân từ trẻ em. Nếu bạn phát hiện thông tin của trẻ em được cung cấp cho chúng tôi, vui lòng liên hệ để được xử lý kịp thời."
    },
    {
      id: "9",
      title: "Thay đổi chính sách bảo mật",
      content: "LUCE BIO TECH có thể cập nhật Chính sách bảo mật này theo thời gian để phù hợp với quy định pháp luật và hoạt động thực tế. Mọi thay đổi sẽ được công bố trên trang này và có hiệu lực kể từ ngày cập nhật."
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <section className="bg-primary text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3FA796_1px,transparent_1px)] [background-size:32px_32px]"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <button 
            onClick={() => navigate(-1)} 
            className="mb-8 inline-flex items-center gap-2 text-accent-light/60 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Quay lại
          </button>
          <h1 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tight mb-4">CHÍNH SÁCH BẢO MẬT</h1>
          <p className="text-accent-light/60 font-medium">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </section>

      {/* Content Section */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-slate-50/50 rounded-[3rem] p-8 md:p-16 border border-slate-100 shadow-soft">
          <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-primary prose-strong:font-black">
            <p className="text-lg font-medium text-primary mb-12 italic border-l-4 border-accent pl-6">
              LUCE BIO TECH (“chúng tôi”) cam kết tôn trọng và bảo vệ quyền riêng tư của người dùng khi truy cập và sử dụng website. Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của bạn.
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
                        <ul className="space-y-3 list-none p-0">
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
                              {sub.text && <p className="text-slate-600 leading-relaxed">{sub.text}</p>}
                              {sub.items && (
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0">
                                  {sub.items.map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wide bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <span className="size-2 rounded-full bg-accent"></span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
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
                    10
                  </span>
                  <div className="flex-1 pt-2">
                    <h2 className="text-2xl font-black text-primary font-display uppercase tracking-tight mb-6">Thông tin liên hệ</h2>
                    <p className="text-slate-600 mb-6">Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào liên quan đến Chính sách bảo mật, vui lòng liên hệ:</p>
                    
                    <div className="bg-[#0B3C49] text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10">
                          <span className="material-symbols-outlined text-[100px]">security</span>
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

            {/* Disclaimer */}
            <div className="mt-20 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
               <span className="material-symbols-outlined text-amber-500 text-3xl">warning</span>
               <div>
                  <h4 className="text-amber-800 font-black uppercase text-sm mb-1 tracking-wider">Lưu ý quan trọng</h4>
                  <p className="text-amber-700/80 text-sm font-medium leading-relaxed">
                    Thông tin trên website LUCE BIO TECH chỉ mang tính chất tham khảo khoa học và không thay thế cho tư vấn y tế, pháp lý hoặc chuyên gia da liễu.
                  </p>
               </div>
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

export default PrivacyPolicy;
