
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useBranding } from '../../../contexts/BrandingContext';

// --- Types ---
interface OrderItem {
   id: string;
   name?: string;
   description: string;
   quantity: number;
   unitPrice: number;
   lineTotal?: number;
}

interface Order {
   orderId?: string;
   orderCode?: string;
   orderDate?: string;
   type: string;
   propertyName?: string;
   propertyCode?: string;
   client: {
      name: string;
      company?: string;
      email?: string;
      phone?: string;
      address?: string;
   };
   brief?: string;
   items: OrderItem[];
   discountAmount?: number;
   vat?: { enabled: boolean; rate: number; amount: number };
   subtotal?: number;
   total?: number;
   notes?: string;
   createdAt?: any;
   paymentStatus?: string;
}

const OrderPrint: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { branding } = useBranding();
   const [order, setOrder] = useState<Order | null>(null);
   const [loading, setLoading] = useState(true);

   // Print Settings
   const [docType, setDocType] = useState<'deposit' | 'contract'>('deposit');
   const [showStamp, setShowStamp] = useState(true);

   useEffect(() => {
      const fetchOrder = async () => {
         if (!id) return;
         try {
            const docRef = doc(db, 'orders', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
               setOrder(docSnap.data() as Order);
            }
         } catch (err) {
            console.error("Error fetching order for print:", err);
         } finally {
            setLoading(false);
         }
      };
      fetchOrder();
   }, [id]);

   // Helpers
   const formatVND = (amount?: number) => {
      if (typeof amount !== 'number') return '0 ₫';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
   };

   const formatDate = (dateStr?: string, fbDate?: any) => {
      if (dateStr) {
         const parts = dateStr.split('-');
         return `Ngày ${parts[2]} tháng ${parts[1]} năm ${parts[0]}`;
      }
      if (fbDate) {
         const d = fbDate.toDate ? fbDate.toDate() : new Date(fbDate);
         return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
      }
      const now = new Date();
      return `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
   };

   const calculatedSubtotal = useMemo(() => {
      if (!order) return 0;
      return order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
   }, [order]);

   const discountVal = order?.discountAmount || 0;
   const finalTotal = (order?.total || 0);

   if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;
   if (!order) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4"><h2 className="text-xl font-bold text-slate-400">Không tìm thấy dữ liệu đơn hàng</h2><button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold underline">Quay lại</button></div>;

   return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 print:py-0 print:bg-white font-serif">

         {/* TOOLBAR */}
         <div className="w-[210mm] mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-xl border border-slate-200 print:hidden font-sans">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors border border-slate-100">
                  <span className="material-symbols-outlined">arrow_back</span>
               </button>
               <div className="h-6 w-px bg-slate-200"></div>
               <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                  <button
                     onClick={() => setDocType('deposit')}
                     className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${docType === 'deposit' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                  >
                     PHIẾU CỌC
                  </button>
                  <button
                     onClick={() => setDocType('contract')}
                     className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${docType === 'contract' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                  >
                     HỢP ĐỒNG
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showStamp} onChange={e => setShowStamp(e.target.checked)} className="size-4 rounded text-primary focus:ring-primary/20" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hiện dấu mộc</span>
               </label>
               <button
                  onClick={() => window.print()}
                  className="px-6 h-10 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
               >
                  <span className="material-symbols-outlined text-lg">print</span>
                  In / Xuất PDF
               </button>
            </div>
         </div>

         {/* A4 PAPER */}
         <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] relative print:shadow-none print:p-0 text-slate-900 leading-relaxed">

            {/* HEADER */}
            <div className="flex justify-between items-start mb-8 relative z-20">
               <div className="w-1/2">
                  {branding.logoUrl ? (
                     <img src={branding.logoUrl} alt="Logo" className="h-16 w-auto object-contain mb-2" />
                  ) : (
                     <div className="text-2xl font-black text-primary font-display uppercase tracking-tight mb-1">{branding.companyName || 'LUCE LAND'}</div>
                  )}
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">SÀN GIAO DỊCH BẤT ĐỘNG SẢN</p>
                  <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                     <p>Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. HCM</p>
                     <p>Hotline: 0909 123 456 - Email: contact@luceland.vn</p>
                     <p>Website: www.luceland.vn</p>
                  </div>
               </div>
               <div className="w-1/2 text-right">
                  <h1 className="text-xl font-black text-slate-900 uppercase font-display tracking-wide mb-1">
                     {docType === 'deposit' ? 'PHIẾU XÁC NHẬN ĐẶT CỌC' : 'THỎA THUẬN ĐẶT CỌC'}
                  </h1>
                  <p className="text-xs font-bold text-slate-500 italic">Số: {order.orderCode || order.orderId}</p>
                  <p className="text-xs font-medium text-slate-400 italic">Tp. HCM, {formatDate(order.orderDate, order.createdAt)}</p>
               </div>
            </div>

            {/* TITLE */}
            <div className="text-center mb-8">
               <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900 decoration-4 underline decoration-slate-200 underline-offset-8">
                  {docType === 'deposit' ? 'GIẤY BIÊN NHẬN ĐẶT CỌC' : 'HỢP ĐỒNG ĐẶT CỌC'}
               </h2>
            </div>

            {/* CONTENT BODY */}
            <div className="space-y-6 text-[13px] text-justify">

               {/* BEN A */}
               <div>
                  <h3 className="font-bold uppercase text-sm mb-2 text-slate-800 border-b border-slate-200 inline-block pr-6">I. BÊN NHẬN ĐẶT CỌC (BÊN A):</h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-1 pl-4 mt-2">
                     <span className="font-bold text-slate-600">Đơn vị:</span>
                     <span className="font-bold uppercase">{branding.companyName || 'CÔNG TY TNHH LUCE LAND'}</span>

                     <span className="font-bold text-slate-600">Đại diện:</span>
                     <span>Ông/Bà ............................................................................ Chức vụ: .........................</span>

                     <span className="font-bold text-slate-600">Địa chỉ:</span>
                     <span>Khu Công Nghệ Cao, TP. Thủ Đức, TP. HCM</span>

                     <span className="font-bold text-slate-600">Mã số thuế:</span>
                     <span>0312345678</span>
                  </div>
               </div>

               {/* BEN B */}
               <div>
                  <h3 className="font-bold uppercase text-sm mb-2 text-slate-800 border-b border-slate-200 inline-block pr-6">II. BÊN ĐẶT CỌC (BÊN B):</h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-1 pl-4 mt-2">
                     <span className="font-bold text-slate-600">Ông/Bà:</span>
                     <span className="font-bold uppercase text-lg">{order.client.name}</span>

                     <span className="font-bold text-slate-600">Số CMND/CCCD:</span>
                     <span>................................................... Cấp ngày: ................... Tại: ...................</span>

                     <span className="font-bold text-slate-600">Điện thoại:</span>
                     <span>{order.client.phone}</span>

                     <span className="font-bold text-slate-600">Địa chỉ:</span>
                     <span>{order.client.address || '.....................................................................................................................'}</span>
                  </div>
               </div>

               {/* LOI GIOI THIEU */}
               <div>
                  <p>Hôm nay, {formatDate(order.orderDate, order.createdAt)}, hai bên đã thống nhất ký kết thỏa thuận đặt cọc với các nội dung sau:</p>
               </div>

               {/* NOI DUNG GIAO DICH */}
               <div className="bg-slate-50 p-6 rounded-lg border border-slate-200/50">
                  <h3 className="font-bold uppercase text-sm mb-4 text-center text-slate-800">THÔNG TIN BẤT ĐỘNG SẢN & GIAO DỊCH</h3>

                  <div className="space-y-4">
                     <div className="flex items-start gap-4">
                        <span className="w-32 shrink-0 font-bold text-slate-600">Bất động sản:</span>
                        <span className="font-bold text-slate-900 uppercase">{order.propertyName || order.items[0]?.description}</span>
                     </div>

                     <div className="flex items-center gap-4">
                        <span className="w-32 shrink-0 font-bold text-slate-600">Mã sản phẩm:</span>
                        <span className="font-mono bg-white px-2 border border-slate-200 rounded">{order.propertyCode || 'N/A'}</span>
                     </div>

                     <div className="h-px bg-slate-200 my-2"></div>

                     <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div className="flex justify-between">
                           <span className="font-bold text-slate-600">Giá trị niêm yết:</span>
                           <span>{formatVND(calculatedSubtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="font-bold text-slate-600">Chiết khấu:</span>
                           <span className="text-slate-900">{formatVND(discountVal)}</span>
                        </div>
                        <div className="flex justify-between col-span-2 bg-white p-2 rounded border border-slate-300">
                           <span className="font-bold text-slate-800 uppercase">SỐ TIỀN ĐẶT CỌC:</span>
                           <span className="font-black text-lg text-slate-900">{formatVND(finalTotal)}</span>
                        </div>
                        <div className="col-span-2 text-right">
                           <span className="text-[11px] italic text-slate-500">(Bằng chữ: ................................................................................................................................. đồng)</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* DIEU KHOAN */}
               <div>
                  <h3 className="font-bold uppercase text-sm mb-2 text-slate-800">III. ĐIỀU KHOẢN CHUNG:</h3>
                  <ul className="list-decimal pl-5 space-y-1 text-slate-600 marker:font-bold">
                     <li>Số tiền đặt cọc trên sẽ được chuyển thành đợt thanh toán đầu tiên khi hai bên ký Hợp Đồng Mua Bán chính thức.</li>
                     <li>Bên B cam kết hoàn tất thủ tục thanh toán đợt kế tiếp trong vòng 07 ngày làm việc kể từ ngày ký phiếu này.</li>
                     <li>Nếu Bên B không thực hiện đúng cam kết, số tiền đặt cọc này sẽ thuộc về Bên A.</li>
                     <li>Phiếu này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</li>
                  </ul>
               </div>

            </div>

            {/* SIGNATURES */}
            <div className="grid grid-cols-2 gap-20 mt-16 text-center">
               <div>
                  <p className="font-bold uppercase text-xs mb-1">Đại diện Bên B</p>
                  <p className="text-[10px] italic mb-16">(Ký và ghi rõ họ tên)</p>
                  <p className="font-bold uppercase text-sm">{order.client.name}</p>
               </div>
               <div className="relative">
                  <p className="font-bold uppercase text-xs mb-1">Đại diện Bên A</p>
                  <p className="text-[10px] italic mb-16">(Ký và đóng dấu)</p>

                  {/* STAMP */}
                  {showStamp && (
                     <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-80 mix-blend-multiply rotate-[-15deg] pointer-events-none">
                        <div className="size-32 rounded-full border-4 border-red-600 flex items-center justify-center p-2 relative bg-white/10 backdrop-blur-[1px]">
                           <div className="size-full rounded-full border border-red-600 flex items-center justify-center text-center">
                              <div className="space-y-1">
                                 <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">Signed & Sealed</p>
                                 <p className="text-[12px] font-black text-red-600 uppercase leading-none">{branding.companyName || 'LUCE LAND'}</p>
                                 <p className="text-[8px] font-bold text-red-600">CONFIRMED</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  <p className="font-bold uppercase text-sm relative z-10">{branding.companyName || 'LUCE LAND'}</p>
               </div>
            </div>

            {/* FOOTER DECORATION */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 bg-repeat-x border-t border-slate-200"></div>
         </div>
      </div>
   );
};

export default OrderPrint;
