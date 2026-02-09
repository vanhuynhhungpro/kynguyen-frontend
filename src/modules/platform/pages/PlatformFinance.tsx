
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';
import { FinanceService, PayoutRequest } from '../../../services/FinanceService';

interface FinanceConfig {
    commissionRate: number; // percentage (e.g., 20)
    minWithdrawal: number;
    paymentMethods: string[];
}

const PlatformFinance: React.FC = () => {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'config'>('overview');
    const [loading, setLoading] = useState(false);

    // Config State
    const [config, setConfig] = useState<FinanceConfig>({
        commissionRate: 20,
        minWithdrawal: 500000,
        paymentMethods: ['vietqr', 'bank_transfer']
    });

    // Real Payout Data
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalCommissionsPaid: 0,
        pendingPayouts: 0,
        profitMargin: 0
    });

    useEffect(() => {
        fetchConfig();
        fetchPayouts();
        fetchStats();
    }, []);

    const fetchConfig = async () => {
        try {
            const docRef = doc(db, 'platform_settings', 'finance');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setConfig(docSnap.data() as FinanceConfig);
            }
        } catch (error) {
            console.error("Error fetching finance config:", error);
        }
    };

    const fetchPayouts = async () => {
        try {
            const data = await FinanceService.getPayouts(); // Fetch all payouts
            setPayouts(data);
        } catch (error) {
            console.error("Error fetching payouts:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await FinanceService.getPlatformStats();
            setStats(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const handleSaveConfig = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, 'platform_settings', 'finance'), {
                ...config,
                updatedAt: serverTimestamp(),
                updatedBy: userProfile?.uid
            });
            await createSystemLog('UPDATE', 'FINANCE', `Cập nhật cấu hình tài chính: ${config.commissionRate}% hoa hồng`, userProfile, 'high');
            alert("Đã lưu cấu hình tài chính!");
        } catch (error) {
            console.error("Error saving config:", error);
            alert("Lỗi khi lưu cấu hình.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprovePayout = async (id: string) => {
        if (!window.confirm("Xác nhận đã chuyển khoản cho người dùng này?")) return;
        try {
            if (userProfile?.uid) {
                await FinanceService.approvePayout(id, userProfile.uid);
                alert("Đã duyệt yêu cầu rút tiền thành công!");
                fetchPayouts(); // Refresh
                fetchStats(); // Refresh stats
                await createSystemLog('PAYMENT', 'FINANCE', `Duyệt yêu cầu rút tiền ${id} `, userProfile, 'high');
            }
        } catch (error) {
            console.error("Error approving payout:", error);
            alert("Lỗi khi duyệt.");
        }
    };

    const handleRejectPayout = async (id: string) => {
        const reason = prompt("Nhập lý do từ chối:");
        if (!reason) return;

        try {
            if (userProfile?.uid) {
                await FinanceService.rejectPayout(id, reason, userProfile.uid);
                alert("Đã từ chối yêu cầu.");
                fetchPayouts(); // Refresh
                fetchStats(); // Refresh stats
            }
        } catch (error) {
            console.error("Error rejecting payout:", error);
            alert("Lỗi khi từ chối.");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white font-display tracking-tight uppercase">Tài chính & Affiliate</h2>
                    <p className="text-slate-400 font-medium">Quản lý dòng tiền, hoa hồng và yêu cầu rút tiền.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng Doanh Thu</p>
                    <h3 className="text-2xl font-black text-emerald-400 mt-2">
                        {new Intl.NumberFormat('vi-VN').format(stats.totalRevenue)}đ
                    </h3>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoa hồng đã trả</p>
                    <h3 className="text-2xl font-black text-blue-400 mt-2">
                        {new Intl.NumberFormat('vi-VN').format(stats.totalCommissionsPaid)}đ
                    </h3>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chờ thanh toán</p>
                    <h3 className="text-2xl font-black text-amber-400 mt-2">
                        {new Intl.NumberFormat('vi-VN').format(stats.pendingPayouts)}đ
                    </h3>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tỷ suất lợi nhuận</p>
                    <h3 className="text-2xl font-black text-white mt-2">{stats.profitMargin}%</h3>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-800 overflow-x-auto hidden-scrollbar">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Tổng quan
                </button>
                <button
                    onClick={() => setActiveTab('payouts')}
                    className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'payouts' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Yêu cầu rút tiền <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">{payouts.filter(p => p.status === 'pending').length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('config')}
                    className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'config' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Cấu hình
                </button>
            </div>

            {/* Content */}
            <div className="bg-slate-800 rounded-[2rem] border border-slate-700 p-8">
                {activeTab === 'overview' && (
                    <div className="text-center py-20">
                        <div className="size-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-500">bar_chart</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Biểu đồ doanh thu</h3>
                        <p className="text-slate-400">Đang phát triển tính năng vẽ biểu đồ chi tiết...</p>
                    </div>
                )}

                {activeTab === 'payouts' && (
                    <div className="overflow-x-auto">
                        {payouts.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4 rounded-tl-xl">Mã</th>
                                        <th className="px-6 py-4">Tenant</th>
                                        <th className="px-6 py-4">Số tiền</th>
                                        <th className="px-6 py-4">Ngân hàng</th>
                                        <th className="px-6 py-4">Ngày tạo</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-right rounded-tr-xl">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {payouts.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-300">{p.id.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 font-bold text-white">{p.tenantId}</td>
                                            <td className="px-6 py-4 font-bold text-emerald-400">{new Intl.NumberFormat('vi-VN').format(p.amount)}đ</td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {p.bankInfo?.bankName} - {p.bankInfo?.accountNumber}
                                                <br />
                                                <span className="text-[10px] uppercase text-slate-500">{p.bankInfo?.accountName}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px - 2 py - 1 rounded text - [10px] font - bold uppercase ${p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    p.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                                                        'bg-amber-500/20 text-amber-400'
                                                    } `}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {p.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleApprovePayout(p.id)} className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all" title="Duyệt">
                                                            <span className="material-symbols-outlined text-lg">check</span>
                                                        </button>
                                                        <button onClick={() => handleRejectPayout(p.id)} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all" title="Từ chối">
                                                            <span className="material-symbols-outlined text-lg">close</span>
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="p-8 text-center text-slate-400 italic">Chưa có yêu cầu rút tiền nào.</p>
                        )}
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="max-w-xl space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phần trăm hoa hồng giới thiệu (%)</label>
                            <input
                                type="number"
                                value={config.commissionRate}
                                onChange={e => setConfig({ ...config, commissionRate: Number(e.target.value) })}
                                className="w-full h-12 px-4 mt-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-2">Ví dụ: 20% trên giá trị gói cước khách hàng thanh toán.</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hạn mức rút tối thiểu (VND)</label>
                            <input
                                type="number"
                                value={config.minWithdrawal}
                                onChange={e => setConfig({ ...config, minWithdrawal: Number(e.target.value) })}
                                className="w-full h-12 px-4 mt-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleSaveConfig}
                            disabled={loading}
                            className="h-12 px-8 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                        >
                            {loading && <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>}
                            Lưu cấu hình
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlatformFinance;
