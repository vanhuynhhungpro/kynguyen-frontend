import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { FinanceService, AffiliateTransaction, Invoice, PayoutRequest } from '../../../services/FinanceService';
import { serverTimestamp } from 'firebase/firestore';

const MySubscription: React.FC = () => {
    const { userProfile } = useAuth();
    const { tenantId } = useBranding();
    const [activeTab, setActiveTab] = useState<'overview' | 'affiliate' | 'billing'>('overview');
    const [loading, setLoading] = useState(false);

    // Real Data States
    const [walletStats, setWalletStats] = useState({
        balance: 0,
        totalEarnings: 0,
        affiliateCode: '',
        affiliateClicks: 0,
        affiliateReferrals: 0
    });
    const [transactions, setTransactions] = useState<AffiliateTransaction[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);

    useEffect(() => {
        if (tenantId) {
            fetchData();
        }
    }, [tenantId]);

    const fetchData = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [stats, trans, invs, pays] = await Promise.all([
                FinanceService.getWalletStats(tenantId),
                FinanceService.getTransactions(tenantId),
                FinanceService.getMyInvoices(tenantId),
                FinanceService.getMyPayouts(tenantId)
            ]);

            if (stats) setWalletStats(stats);
            if (trans) setTransactions(trans);
            if (invs) setInvoices(invs);
            if (pays) setPayouts(pays);
        } catch (error) {
            console.error("Error loading finance data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPayout = async () => {
        const amount = Number(prompt("Nhập số tiền muốn rút (tối thiểu 500,000đ):", "500000"));
        if (!amount || isNaN(amount) || amount < 500000) {
            alert("Số tiền không hợp lệ hoặc nhỏ hơn hạn mức tối thiểu.");
            return;
        }
        if (amount > walletStats.balance) {
            alert("Số dư không đủ.");
            return;
        }

        // Mock Bank Info for now (In real app, user sets this in Settings)
        const bankInfo = {
            bankName: "Techcombank",
            accountNumber: "19033333333333",
            accountName: userProfile?.fullName || "TENANT USER"
        };

        if (!window.confirm(`Xác nhận rút ${new Intl.NumberFormat('vi-VN').format(amount)}đ về tài khoản ${bankInfo.bankName} - ${bankInfo.accountNumber}?`)) return;

        try {
            if (tenantId) {
                await FinanceService.requestPayout(tenantId, amount, bankInfo);
                alert("Yêu cầu rút tiền đã được gửi!");
                fetchData(); // Refresh data
            }
        } catch (error) {
            alert("Lỗi gửi yêu cầu.");
        }
    };

    const getReferralLink = () => {
        const code = walletStats.affiliateCode || tenantId;
        if (!code) return 'Đang tạo link...';
        return `${window.location.origin}/#/ref/${code}`;
    };

    const copyToClipboard = () => {
        const url = getReferralLink();
        if (url === 'Đang tạo link...') return;
        navigator.clipboard.writeText(url);
        alert('Đã copy link giới thiệu: ' + url);
    };

    // Calculate plan expiry mock (In real app, get from tenant field)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-primary font-display uppercase tracking-tight">Gói Cước & Đối Tác</h1>
                <p className="text-slate-500 font-medium">Quản lý đăng ký dịch vụ và thu nhập từ giới thiệu.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan Card */}
                <div className="bg-gradient-to-br from-primary to-primary-dark rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <span className="material-symbols-outlined text-[150px]">verified</span>
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">
                                <span className="size-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                Đang hoạt động
                            </div>
                            <p className="text-primary-light font-bold text-sm uppercase tracking-widest mb-1">Gói hiện tại</p>
                            <h2 className="text-4xl font-black mb-1">PRO ✨</h2>
                            <p className="opacity-80 text-sm">Gia hạn: {nextBillingDate.toLocaleDateString('vi-VN')}</p>
                        </div>
                        <button className="mt-8 w-full py-3 bg-white text-primary font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors shadow-lg">
                            Nâng cấp gói
                        </button>
                    </div>
                </div>

                {/* Affiliate Wallet */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ví hoa hồng</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletStats.balance)}
                        </h2>
                        <p className="text-slate-400 text-xs font-medium mt-1">Tổng thu nhập: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletStats.totalEarnings)}</p>
                    </div>
                    <button onClick={handleRequestPayout} disabled={walletStats.balance < 500000} className="mt-6 w-full py-3 bg-amber-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        Rút tiền
                    </button>
                </div>

                {/* Affiliate Stats */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl">group_add</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{walletStats.affiliateReferrals}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Người giới thiệu</p>
                        </div>
                    </div>
                    <div className="w-full h-px bg-slate-50"></div>
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-2xl">ads_click</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{walletStats.affiliateClicks}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lượt click link</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Chi tiết gói
                    </button>
                    <button
                        onClick={() => setActiveTab('affiliate')}
                        className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'affiliate' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Tiếp thị liên kết
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'billing' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        Lịch sử thanh toán
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'overview' && (
                        <div className="max-w-3xl">
                            <h3 className="text-lg font-bold text-primary mb-6">Quyền lợi gói PRO</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['Quản lý 500 BĐS', 'AI Viết bài tự động', '10 Tài khoản nhân viên', 'Tên miền riêng'].map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="size-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                                        </div>
                                        <span className="font-bold text-slate-600 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'affiliate' && (
                        <div className="space-y-8">
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Link giới thiệu của bạn</label>
                                <div className="flex gap-4">
                                    <input
                                        readOnly
                                        value={getReferralLink()}
                                        className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="h-12 px-6 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">content_copy</span>
                                        Copy
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium italic">
                                    * Chia sẻ link này để nhận 20% hoa hồng trọn đời từ mỗi khách hàng đăng ký mới.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold text-primary mb-4">Giao dịch hoa hồng</h3>
                                    <div className="overflow-hidden rounded-xl border border-slate-100">
                                        {transactions.length > 0 ? (
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                                                    <tr>
                                                        <th className="px-6 py-4">Mô tả</th>
                                                        <th className="px-6 py-4">Số tiền</th>
                                                        <th className="px-6 py-4 text-right">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {transactions.map(item => (
                                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                                            <td className="px-6 py-4 font-bold text-slate-700">{item.description}</td>
                                                            <td className="px-6 py-4 font-bold text-emerald-600">+{new Intl.NumberFormat('vi-VN').format(item.amount)}đ</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                                    }`}>
                                                                    {item.status === 'completed' ? 'Đã duyệt' : 'Chờ duyệt'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="p-8 text-center text-slate-400 italic">Chưa có giao dịch hoa hồng nào.</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-primary mb-4">Lịch sử rút tiền</h3>
                                    <div className="overflow-hidden rounded-xl border border-slate-100">
                                        {payouts.length > 0 ? (
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                                                    <tr>
                                                        <th className="px-6 py-4">Ngày</th>
                                                        <th className="px-6 py-4">Số tiền</th>
                                                        <th className="px-6 py-4 text-right">TT</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {payouts.map(p => (
                                                        <tr key={p.id} className="hover:bg-slate-50/50">
                                                            <td className="px-6 py-4 text-slate-500 font-medium">{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A'}</td>
                                                            <td className="px-6 py-4 font-bold text-slate-700">{new Intl.NumberFormat('vi-VN').format(p.amount)}đ</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                                                    p.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                                                        'bg-amber-50 text-amber-600'
                                                                    }`}>
                                                                    {p.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="p-8 text-center text-slate-400 italic">Chưa có yêu cầu rút tiền nào.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div>
                            <h3 className="text-lg font-bold text-primary mb-4">Lịch sử thanh toán</h3>
                            <div className="overflow-hidden rounded-xl border border-slate-100">
                                {invoices.length > 0 ? (
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                                            <tr>
                                                <th className="px-6 py-4">Mã hóa đơn</th>
                                                <th className="px-6 py-4">Ngày thanh toán</th>
                                                <th className="px-6 py-4">Số tiền</th>
                                                <th className="px-6 py-4 text-right">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {invoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-slate-400 text-lg">receipt_long</span>
                                                        {inv.id}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 font-medium">{inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A'}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-700">{new Intl.NumberFormat('vi-VN').format(inv.amount)}đ</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                                                            }`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="p-8 text-center text-slate-400 italic">Chưa có hóa đơn nào.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MySubscription;
