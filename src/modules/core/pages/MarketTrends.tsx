
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendApi, TrendKPI, TrendItem, TrendDetail } from '../../../services/TrendApi';

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-medium leading-relaxed rounded-xl shadow-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50">
    {text}
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
  </div>
);

const MarketTrends: React.FC = () => {
  const navigate = useNavigate();
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const [kpis, setKpis] = useState<TrendKPI[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<TrendDetail | null>(null);
  const [activeTab, setActiveTab] = useState('Tổng quan');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [industry, setIndustry] = useState('REAL_ESTATE');
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    loadData();
  }, [industry, timeframe]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, list] = await Promise.all([
        TrendApi.getSummary({ industry, timeframe }),
        TrendApi.getTrends({ industry, timeframe })
      ]);
      setKpis(summary);
      setTrends(list);
      if (list.length > 0 && !selectedTrend) {
        handleTrendClick(list[0].id);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu xu hướng", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrendClick = async (id: string) => {
    if (selectedTrend?.id === id) return;
    setDetailLoading(true);
    try {
      const detail = await TrendApi.getTrendDetail(id);
      setSelectedTrend(detail);
      setActiveTab('Tổng quan');
      if (detailPanelRef.current) detailPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Lỗi tải chi tiết", error);
    } finally {
      setTimeout(() => setDetailLoading(false), 300);
    }
  };

  const runAIAnalysis = async () => {
    if (!selectedTrend) return;
    setAiLoading(true);
    try {
      const aiData = await TrendApi.analyzeWithAI(selectedTrend.title);
      setSelectedTrend(prev => prev ? { ...prev, ...aiData } : null);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
      <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-10">
        <div className="max-w-[1600px] mx-auto w-full space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-slate-900 text-2xl font-bold tracking-tight font-display">Trung Tâm Phân Tích Xu Hướng</h2>
              <p className="text-slate-500 text-sm font-medium">Dữ liệu thị trường kết hợp AI Grounding thế hệ mới.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadData} className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">sync</span> Làm mới
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-primary hover:shadow-lg transition-all cursor-default group">
                <div className="flex justify-between items-start mb-2">
                  <div className="relative group/info">
                    <span className={`material-symbols-outlined text-${kpi.color} bg-${kpi.color}/10 p-1.5 rounded-lg text-[20px]`}>{kpi.icon}</span>
                    <InfoTooltip text={kpi.tooltip} />
                  </div>
                  <span className={`text-[10px] font-black ${kpi.status === 'up' ? 'text-emerald-600' : 'text-rose-600'} flex items-center gap-0.5`}>
                     {kpi.trend}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{kpi.label}</p>
                <p className="text-lg font-black text-slate-900 truncate font-display">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex max-w-[1600px] mx-auto w-full divide-x divide-slate-100">
        <div className="w-[420px] overflow-y-auto custom-scrollbar bg-slate-50/30 p-6 space-y-4 shrink-0">
          <div className="flex justify-between items-center px-2 mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xu hướng thị trường ({trends.length})</span>
            <div className="flex p-1 bg-slate-200 rounded-lg gap-1">
               <button onClick={() => setIndustry('REAL_ESTATE')} className={`px-3 py-1 rounded text-[9px] font-black uppercase ${industry === 'REAL_ESTATE' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>BĐS</button>
               <button onClick={() => setIndustry('INTERIOR')} className={`px-3 py-1 rounded text-[9px] font-black uppercase ${industry === 'INTERIOR' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Nội thất</button>
            </div>
          </div>

          {loading ? (
             <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
             </div>
          ) : trends.map(t => (
            <div 
              key={t.id} 
              onClick={() => handleTrendClick(t.id)}
              className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all cursor-pointer group relative ${selectedTrend?.id === t.id ? 'border-primary ring-4 ring-primary/5' : 'border-transparent hover:border-slate-300'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1 overflow-hidden">
                  <h3 className="text-lg font-black text-slate-900 truncate font-display">{t.title}</h3>
                  <p className="text-xs text-slate-500 truncate font-medium">{t.subtitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-slate-800 font-display">{t.score}</div>
                  <div className="text-[8px] text-slate-400 font-black tracking-widest uppercase">TS Core</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="h-10 w-24 flex items-end gap-1">
                  {t.spark_data.map((v, i) => (
                    <div key={i} className={`w-full rounded-t-md ${selectedTrend?.id === t.id ? 'bg-primary' : 'bg-slate-200'}`} style={{ height: `${v}%` }}></div>
                  ))}
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black ${t.delta_pct >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>+{t.delta_pct}%</div>
                  <div className="text-[9px] text-slate-400 font-black">Tuần này</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div ref={detailPanelRef} className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col relative">
          {selectedTrend ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="px-10 py-12 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20">{selectedTrend.industry}</span>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight font-display">{selectedTrend.title}</h1>
                    <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">{selectedTrend.subtitle}</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={runAIAnalysis}
                      disabled={aiLoading}
                      className="h-12 px-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all font-black text-[11px] uppercase tracking-widest disabled:opacity-50"
                    >
                      {aiLoading ? <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg filled-icon">smart_toy</span>}
                      {aiLoading ? 'AI Đang Suy Luận...' : 'Phân tích AI Chuyên Sâu'}
                    </button>
                    <button onClick={() => navigate('/manage-properties')} className="h-12 px-8 flex items-center justify-center gap-2 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">
                      <span className="material-symbols-outlined text-lg">add_home_work</span> Đăng tin theo xu hướng
                    </button>
                  </div>
                </div>

                <div className="mt-12 bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-card">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="font-black text-slate-900 text-xl font-display uppercase tracking-tight">Biểu đồ tăng trưởng quan tâm</h3>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><span className="size-2 rounded-full bg-primary"></span> Dữ liệu thật</div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><span className="size-2 rounded-full bg-slate-200"></span> Dự báo</div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedTrend.timeseries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }} />
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }} />
                        <Area type="monotone" dataKey="value" stroke="#0B3C49" strokeWidth={4} fillOpacity={0.1} fill="#0B3C49" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <section>
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">description</span> TỔNG QUAN CHIẾN LƯỢC
                       </h4>
                       <p className="text-slate-600 leading-relaxed text-base font-medium">{selectedTrend.description}</p>
                    </section>
                    
                    <section>
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Từ khóa liên quan</h4>
                       <div className="flex flex-wrap gap-2.5">
                          {selectedTrend.related_keywords.map(kw => (
                             <span key={kw.term} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 hover:border-primary transition-all cursor-default">
                                #{kw.term.toUpperCase()}
                             </span>
                          ))}
                       </div>
                    </section>
                 </div>

                 <div className="space-y-8">
                    <div className="bg-[#0B3C49] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10"><span className="material-symbols-outlined text-[100px]">lab_profile</span></div>
                       <h4 className="text-[11px] font-black text-accent uppercase tracking-[0.2em] mb-6 relative z-10">Góc nhìn chuyên gia</h4>
                       <div className="space-y-6 relative z-10">
                          <div>
                             <p className="text-[9px] font-black text-white/40 uppercase mb-2">Chiến lược đầu tư</p>
                             <p className="text-sm font-medium leading-relaxed">{selectedTrend.market_insights?.investment_strategy || "Đang cập nhật..."}</p>
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-white/40 uppercase mb-2">Đánh giá thanh khoản</p>
                             <p className="text-sm font-medium leading-relaxed">{selectedTrend.market_insights?.liquidity_potential || "Đang cập nhật..."}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
               <span className="material-symbols-outlined text-8xl mb-6 opacity-10">analytics</span>
               <h3 className="text-2xl font-black text-slate-400 mb-2 uppercase tracking-widest font-display">Lựa chọn báo cáo</h3>
               <p className="text-sm max-w-sm leading-relaxed font-medium">Chọn một xu hướng từ danh sách để xem phân tích dữ liệu chuyên sâu và dự báo thị trường.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MarketTrends;
