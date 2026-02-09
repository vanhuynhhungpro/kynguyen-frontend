import React from 'react';
import { generateInvoiceHtml } from '../../utils/invoiceGenerator';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, featureName = "Tính năng nâng cao" }) => {
    if (!isOpen) return null;

    const handleCreateInvoice = () => {
        const html = generateInvoiceHtml({ name: 'Pro', price: 990000, duration: '1 Tháng' });
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
            onClose();
            // TODO: Submit to 'billing_requests' collection in Firestore
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header with Gradient */}
                <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-600 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="text-center z-10 p-6">
                        <div className="inline-flex items-center justify-center size-12 rounded-full bg-white/20 backdrop-blur-md mb-3 text-white border border-white/30">
                            <span className="material-symbols-outlined text-2xl">diamond</span>
                        </div>
                        <h3 className="text-white font-black text-xl uppercase tracking-tight">Nâng cấp Pro</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <h4 className="font-bold text-slate-800 text-lg mb-2">
                        Mở khóa tính năng <span className="text-indigo-600">{featureName}</span>
                    </h4>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        Tính năng này chỉ dành riêng cho tài khoản <strong>Pro Plan</strong>.
                        Nâng cấp ngay để mở khóa toàn bộ sức mạnh của hệ thống AI Real Estate.
                    </p>

                    <ul className="text-left space-y-3 mb-8">
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                            <span>AI Content không giới hạn</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                            <span>Tên miền riêng (Custom Domain)</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-600">
                            <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                            <span>Quản lý nhiều nhân viên hơn</span>
                        </li>
                    </ul>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <button onClick={handleCreateInvoice} className="h-12 border border-indigo-100 text-indigo-600 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">receipt_long</span>
                            Tạo Hóa Đơn
                        </button>
                        <button className="h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                            Nâng cấp ngay
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    </div>

                    <button onClick={handleConfirmPayment} className="w-full py-3 rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold hover:text-indigo-600 hover:border-indigo-200 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Xác nhận đã chuyển khoản
                    </button>

                    <p className="text-[10px] text-slate-400 mt-4 font-medium cursor-pointer hover:text-indigo-600 transition-colors">
                        Tìm hiểu thêm về các gói dịch vụ
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
