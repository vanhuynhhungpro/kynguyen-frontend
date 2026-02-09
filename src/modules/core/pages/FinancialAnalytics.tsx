import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

interface Order {
    id: string;
    orderId: string; // The HD-XXXX format
    customerName: string;
    total: number; // This is the final amount after discount
    paymentStatus: string;
    commissionAmount?: number;
    propertyId?: string;
    createdAt: any;
    items?: any[];
}

interface Property {
    id: string;
    title: string;
    adSpend?: number;
    costPrice?: number;
}

const FinancialAnalytics: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('this_month'); // this_month, last_month, all_time

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Orders
                const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
                const ordersData = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                setOrders(ordersData);

                // Fetch Properties (for Costs)
                const propsSnap = await getDocs(collection(db, 'properties'));
                const propsData = propsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
                setProperties(propsData);

            } catch (error) {
                console.error("Error fetching financial data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const financialData = useMemo(() => {
        let filteredOrders = orders;

        // Filter by Date Range (Simple logic for now)
        const now = new Date();
        if (dateRange === 'this_month') {
            filteredOrders = orders.filter(o => o.createdAt?.toDate().getMonth() === now.getMonth() && o.createdAt?.toDate().getFullYear() === now.getFullYear());
        } else if (dateRange === 'last_month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            filteredOrders = orders.filter(o => o.createdAt?.toDate().getMonth() === lastMonth.getMonth() && o.createdAt?.toDate().getFullYear() === lastMonth.getFullYear());
        }

        let revenue = 0;
        let totalCommission = 0;
        let cogs = 0;

        // Calculate Revenue & Direct Costs from Orders
        const transactions = filteredOrders.map(order => {
            const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'partially_paid';
            const orderRevenue = isPaid ? (order.total || 0) : 0;
            const commission = isPaid ? (order.commissionAmount || 0) : 0;

            // Find property logic for COGS
            let orderCOGS = 0;
            if (order.propertyId) {
                const prop = properties.find(p => p.id === order.propertyId);
                if (prop) {
                    // Warning: This simplistic logic assumes 1 order per property for COGS attribution. 
                    // If partial payment, COGS might need prorating, but usually COGS is realized on sale.
                    // We'll calculate COGS only if 'paid' (sold) for now to be safe.
                    if (order.paymentStatus === 'paid') {
                        orderCOGS = prop.costPrice || 0;
                    }
                }
            }

            if (isPaid) {
                revenue += orderRevenue;
                totalCommission += commission;
                cogs += orderCOGS;
            }

            return {
                ...order,
                revenue: orderRevenue,
                commission,
                cogs: orderCOGS,
                net: orderRevenue - commission - orderCOGS
            };
        }).filter(t => t.paymentStatus === 'paid' || t.paymentStatus === 'partially_paid'); // Only show effective transactions in detailed list

        // Marketing Costs (Total from properties, maybe filtered by date if we had date-based spend)
        // For now, we sum ALL property adSpend as "General Marketing Cost" or try to attribute.
        // Simpler: Sum adSpend of ALL properties (Overhead) or just sold ones? 
        // Usually Marketing is a sunk cost. Let's sum total adSpend of properties created/active in this period? 
        // Hard to filter properties by date range without 'createdAt'. 
        // Let's just take Total AdSpend of ALL properties for 'all_time' or estimate specific properties linked to orders.
        // Better approach for accurate P&L: Sum AdSpend of SOLD properties + General Allocation.
        // Let's stick to: Sum AdSpend of Sold Properties for Gross Profit, but Total Spend for Net Profit?
        // Let's use Total Marketing Spend of all properties for the period context if possible. 
        // To match 'this_month', we'd need ad spend dates. 
        // Fallback: Sum adSpend of properties linked to these filtered orders.

        const linkedPropertyIds = filteredOrders.map(o => o.propertyId).filter(Boolean);
        const marketingCost = properties
            .filter(p => linkedPropertyIds.includes(p.id))
            .reduce((sum, p) => sum + (p.adSpend || 0), 0);

        const profit = revenue - totalCommission - cogs - marketingCost;

        return {
            revenue,
            commission: totalCommission,
            cogs,
            marketingCost,
            profit,
            transactions
        };
    }, [orders, properties, dateRange]);

    // Chart Data Preparation
    const chartData = useMemo(() => {
        // Group by Month (Last 6 Months)
        const months: any = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
            months[key] = { name: key, revenue: 0, profit: 0, cost: 0 };
        }

        orders.forEach(order => {
            if (!order.createdAt) return;
            const d = order.createdAt.toDate();
            const key = `${d.getMonth() + 1}/${d.getFullYear()}`;

            if (months[key] && (order.paymentStatus === 'paid' || order.paymentStatus === 'partially_paid')) {
                const rev = order.total || 0;
                const com = order.commissionAmount || 0;
                let cost = com; // Init with commission

                if (order.propertyId) {
                    const prop = properties.find(p => p.id === order.propertyId);
                    if (prop) {
                        cost += (prop.costPrice || 0); // Add COGS
                        // Note: Ideally AdSpend should be here too, but AdSpend date is unknown. 
                        // We'll add AdSpend of linked property to the month of sale (Simplification)
                        cost += (prop.adSpend || 0);
                    }
                }

                months[key].revenue += rev;
                months[key].cost += cost;
                months[key].profit += (rev - cost);
            }
        });

        return Object.values(months);

    }, [orders, properties]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary font-display uppercase tracking-tight">Tài chính & Lợi nhuận</h1>
                    <p className="text-slate-500 font-medium">Theo dõi dòng tiền, chi phí và hiệu quả kinh doanh.</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => setDateRange('this_month')}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${dateRange === 'this_month' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                    >
                        Tháng này
                    </button>
                    <button
                        onClick={() => setDateRange('last_month')}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${dateRange === 'last_month' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                    >
                        Tháng trước
                    </button>
                    <button
                        onClick={() => setDateRange('all_time')}
                        className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${dateRange === 'all_time' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}
                    >
                        Tất cả
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng Doanh Thu</p>
                    <h3 className="text-2xl font-black text-slate-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(financialData.revenue)}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="size-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-2xl">shopping_cart_checkout</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng Chi Phí (COGS + MKT)</p>
                    <h3 className="text-2xl font-black text-rose-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(financialData.cogs + financialData.marketingCost)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-2">MKT: {new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(financialData.marketingCost)}</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-2xl">diversity_3</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng Hoa Hồng</p>
                    <h3 className="text-2xl font-black text-blue-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(financialData.commission)}
                    </h3>
                </div>

                <div className="bg-gradient-to-br from-primary to-slate-800 p-6 rounded-[2rem] shadow-xl shadow-primary/30 text-white relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 size-24 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                        <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                    </div>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Lợi Nhuận Ròng</p>
                    <h3 className="text-2xl font-black text-white">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(financialData.profit)}
                    </h3>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px]">
                <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-slate-400">bar_chart</span>
                    <h3 className="text-lg font-black text-primary uppercase tracking-tight">Biểu đồ Doanh thu & Lợi nhuận (6 tháng)</h3>
                </div>
                <ResponsiveContainer width="100%" height="80%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(value)} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                        />
                        <Legend />
                        <Bar dataKey="revenue" name="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Details Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-black text-primary uppercase tracking-tight">Chi tiết giao dịch</h3>
                    <span className="text-xs font-bold text-slate-400">{financialData.transactions.length} giao dịch</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Mã HĐ</th>
                                <th className="px-6 py-5">Khách hàng / BĐS</th>
                                <th className="px-6 py-5 text-right">Doanh thu</th>
                                <th className="px-6 py-5 text-right">Giá vốn (COGS)</th>
                                <th className="px-6 py-5 text-right">MKT Cost (Est)</th>
                                <th className="px-6 py-5 text-right">Hoa hồng</th>
                                <th className="px-8 py-5 text-right">Lợi nhuận</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-10 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : financialData.transactions.length > 0 ? (
                                financialData.transactions.map((t) => {
                                    const linkedProp = properties.find(p => p.id === t.propertyId);
                                    const estMarketing = linkedProp?.adSpend || 0;
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-primary">{t.orderId}</td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{t.customerName}</span>
                                                    <span className="text-xs text-slate-400 truncate max-w-[200px]">{linkedProp?.title || 'Không có BĐS'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black text-slate-700">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.revenue)}
                                            </td>
                                            <td className="px-6 py-5 text-right text-slate-500">
                                                {t.cogs > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.cogs) : '-'}
                                            </td>
                                            <td className="px-6 py-5 text-right text-slate-500">
                                                {estMarketing > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estMarketing) : '-'}
                                            </td>
                                            <td className="px-6 py-5 text-right text-indigo-600 font-bold">
                                                {t.commission > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.commission) : '-'}
                                            </td>
                                            <td className={`px-8 py-5 text-right font-black ${t.net - estMarketing > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.net - estMarketing)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={7} className="p-10 text-center text-slate-400 italic">Không có giao dịch nào trong khoảng thời gian này.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialAnalytics;
