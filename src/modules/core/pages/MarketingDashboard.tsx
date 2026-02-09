import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';



const MarketingDashboard: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const properties = snapshot.docs.map(doc => {
                    const d = doc.data();
                    // Calculate pseudo-revenue for demo: leads * average value (mock) or actual orders if linked
                    // For MVP, we use conversion count * price (if sold) or just Leads * Value
                    // Let's assume 1 Lead = Potential Value.
                    // But to calculate valid ROI, we need Revenue. 
                    // Let's assume Revenue = d.revenue (if we had it) or for now, let's allow manual revenue input or mock it.
                    // Actually, let's use the 'adSpend' vs 'leads' for CPA first. 
                    // ROI requires actual sales value. Let's assume we fetch Orders to calculate Revenue per project.
                    // For now, to keep it simple as per plan: Inputs are Budget & AdSpend. 
                    // Revenue is tricky without order linking.
                    // Let's assume we mock Revenue = Conversions * 1% of Price (Booking fee). 
                    // Or just display CPA and Leads for now if Revenue is 0.

                    // Note: In real app, we would query 'orders' matching this property.

                    return {
                        id: doc.id,
                        title: d.title,
                        views: d.views || 0,
                        leads: d.leads || 0,
                        adSpend: d.adSpend || 0,
                        marketingBudget: d.marketingBudget || 0,
                        // Mocking Revenue for demonstration if not present (Real app would sum orders)
                        revenue: d.leads * 50000000 // Assume each lead is worth 50tr in potential (or booking) for ROI demo
                    };
                });
                setData(properties);
            } catch (error) {
                console.error("Error fetching marketing data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const [analyzedData, setAnalyzedData] = useState<any[]>([]);
    const [analyzing, setAnalyzing] = useState(false);

    // Call AI when data is loaded
    useEffect(() => {
        if (data.length === 0) return;

        const runAIAnalysis = async () => {
            setAnalyzing(true);
            try {
                // Prepare simple data for AI to save token usage
                const campaignPayload = data.map(d => ({
                    id: d.id,
                    title: d.title,
                    spend: d.adSpend,
                    leads: d.leads,
                    views: d.views
                })).filter(d => d.spend > 0 || d.leads > 0); // Only analyze active campaigns

                if (campaignPayload.length === 0) {
                    setAnalyzedData(data.map(d => ({ ...d, analysis: { status: 'unknown', reasoning: 'Chưa có dữ liệu chạy quảng cáo.', recommendation: 'Chạy quảng cáo để có số liệu.' } })));
                    return;
                }

                const functions = getFunctions();
                const analyzeFn = httpsCallable(functions, 'analyzeMarketingCampaigns');
                const result: any = await analyzeFn({ campaigns: campaignPayload });
                const aiResults = result.data;

                // Merge AI results back with full data
                const merged = data.map(item => {
                    const aiRes = aiResults.find((r: any) => r.id === item.id);
                    return {
                        ...item,
                        analysis: aiRes || {
                            status: 'unknown',
                            reasoning: 'AI chưa phân tích được.',
                            recommendation: 'Kiểm tra lại dữ liệu.',
                            conversionRate: item.views > 0 ? (item.leads / item.views) * 100 : 0
                        }
                    };
                });
                setAnalyzedData(merged);

            } catch (error) {
                console.error("AI Analysis Failed:", error);
                // Fallback to basic data without AI
                setAnalyzedData(data.map(d => ({ ...d, analysis: { status: 'warning', reasoning: 'Lỗi kết nối server AI.', recommendation: 'Thử lại sau.' } })));
            } finally {
                setAnalyzing(false);
            }
        };

        runAIAnalysis();
    }, [data]);

    const totalSpend = data.reduce((acc, item) => acc + (item.adSpend || 0), 0);
    const totalLeads = data.reduce((acc, item) => acc + (item.leads || 0), 0);
    const avgCpa = totalLeads > 0 ? totalSpend / totalLeads : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-primary font-display uppercase tracking-tight">Marketing Analytics</h1>
                    <p className="text-slate-500 font-medium">Phân tích hiệu quả đầu tư & Tối ưu ngân sách (AI Powered)</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-5 py-2 rounded-xl border border-slate-100 shadow-sm text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng chi phí</p>
                        <p className="text-xl font-black text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSpend)}</p>
                    </div>
                    <div className="bg-white px-5 py-2 rounded-xl border border-slate-100 shadow-sm text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng Leads</p>
                        <p className="text-xl font-black text-orange-500">{totalLeads}</p>
                    </div>
                </div>
            </div>

            {/* AI Advisor Section */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl text-white">
                <div className="absolute top-0 right-0 p-32 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-symbols-outlined text-3xl text-purple-400">psychology</span>
                        <h2 className="text-2xl font-black font-display uppercase tracking-widest">AI Marketing Advisor</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {analyzedData.filter(i => i.adSpend > 0).map((item) => (
                            <div key={item.id} className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/20 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg truncate pr-4" title={item.title}>{item.title}</h3>
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${item.analysis.status === 'excellent' ? 'bg-emerald-400 text-emerald-900' :
                                        item.analysis.status === 'critical' ? 'bg-rose-400 text-rose-900' :
                                            item.analysis.status === 'warning' ? 'bg-amber-400 text-amber-900' :
                                                'bg-blue-400 text-blue-900'
                                        }`}>
                                        {item.analysis.status}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-300 mb-4 h-10 line-clamp-2">
                                    "{item.analysis.reasoning}"
                                </p>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-300 mb-1">Khuyến nghị AI:</p>
                                    <p className="font-bold text-sm text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">lightbulb</span>
                                        {item.analysis.recommendation}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {analyzedData.filter(i => i.adSpend > 0).length === 0 && (
                            <div className="col-span-3 text-center py-10 text-white/50">
                                Chưa có dữ liệu chi tiêu để phân tích.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Chiến dịch / Dự án</th>
                                <th className="px-6 py-4">Ngân sách</th>
                                <th className="px-6 py-4">Đã chi (Ad Spend)</th>
                                <th className="px-6 py-4 text-center">Traffic (Views)</th>
                                <th className="px-6 py-4 text-center">Leads</th>
                                <th className="px-6 py-4 text-center">CPA (Giá/Lead)</th>
                                <th className="px-6 py-4 text-center">CR (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center p-10 text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : (
                                analyzedData.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{item.title}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.marketingBudget)}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.adSpend)}</td>
                                        <td className="px-6 py-4 text-center bg-blue-50/30 text-blue-600 font-bold">{item.views}</td>
                                        <td className="px-6 py-4 text-center bg-orange-50/30 text-orange-600 font-bold">{item.leads}</td>
                                        <td className="px-6 py-4 text-center font-mono text-xs">
                                            {item.leads > 0
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.adSpend / item.leads)
                                                : '-'
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.analysis?.conversionRate > 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {item.analysis?.conversionRate ? item.analysis.conversionRate.toFixed(2) : ((item.leads / item.views) * 100).toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default MarketingDashboard;
