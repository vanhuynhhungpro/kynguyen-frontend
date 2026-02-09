
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Helper to create slug
const createSlug = (str: string) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const AddIngredient: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const ingredientIdFromUrl = searchParams.get('id');
  const isEdit = !!ingredientIdFromUrl;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  // 1. Identity State
  const [id, setId] = useState(''); // Slug ID
  const [isManualId, setIsManualId] = useState(false);
  const [nameVi, setNameVi] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [inci, setInci] = useState('');
  const [cas, setCas] = useState('');
  const [categories, setCategories] = useState<string[]>(['cosmetics']);

  // 2. Technical Usage State
  const [unit, setUnit] = useState<string>('%');
  const [minUse, setMinUse] = useState<number>(0);
  const [maxUse, setMaxUse] = useState<number>(0);
  const [maxRecommended, setMaxRecommended] = useState<number>(0);

  // 3. Cosmetic Specific
  const [phMin, setPhMin] = useState<number>(5.5);
  const [phMax, setPhMax] = useState<number>(7.0);

  // 4. Other Props
  const [solubility, setSolubility] = useState('Water');
  const [physicalForm, setPhysicalForm] = useState('Powder');
  const [molecularWeight, setMolecularWeight] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');

  // 5. Safety & Regulatory
  const [irritationLevel, setIrritationLevel] = useState(1);
  const [isPregnantSafe, setIsPregnantSafe] = useState(true);
  const [markets, setMarkets] = useState(['VN', 'EU', 'US']);

  useEffect(() => {
    if (isEdit && ingredientIdFromUrl) {
      const fetchData = async () => {
        try {
          const snap = await getDoc(doc(db, 'ingredients', ingredientIdFromUrl));
          if (snap.exists()) {
            const d = snap.data();
            setId(snap.id);
            setNameVi(d.name.vi);
            setNameEn(d.name.en);
            setInci(d.inci || '');
            setCas(d.cas || '');
            setCategories(d.categories || []);
            setUnit(d.usage.unit);
            setMinUse(d.usage.min);
            setMaxUse(d.usage.max);
            setMaxRecommended(d.usage.maxRecommended);
            if (d.cosmeticData) {
              setPhMin(d.cosmeticData.phOptimal.min);
              setPhMax(d.cosmeticData.phOptimal.max);
            }
            setSolubility(d.technicalData?.solubility || 'Water');
            setPhysicalForm(d.technicalData?.physicalForm || 'Powder');
            setMolecularWeight(d.technicalData?.molecularWeight || '');
            setBenefits(d.benefits || []);
            setIrritationLevel(d.safety?.irritationLevel || 1);
            setIsPregnantSafe(d.safety?.isPregnantSafe ?? true);
            setMarkets(d.regulatory?.markets || ['VN']);
            setIsManualId(true);
          }
        } catch (e) { console.error(e); setError('Lỗi tải dữ liệu'); }
        finally { setFetching(false); }
      };
      fetchData();
    }
  }, [isEdit, ingredientIdFromUrl]);

  // Sync slug with English Name
  useEffect(() => {
    if (!isManualId && nameEn) {
      setId(createSlug(nameEn));
    }
  }, [nameEn, isManualId]);

  const handleCategoryToggle = (cat: string) => {
    const newCats = categories.includes(cat)
      ? categories.filter(c => c !== cat)
      : [...categories, cat];
    setCategories(newCats);

    // Auto switch units
    if (newCats.includes('cosmetics') && newCats.length === 1) setUnit('%');
    else if (!newCats.includes('cosmetics')) setUnit('mg/day');
  };

  const handleSave = async () => {
    if (!id || !nameEn || !nameVi) {
      setError('Vui lòng điền các thông tin định danh bắt buộc.');
      return;
    }

    // Validation logic
    if (minUse > maxUse) { setError('Mức sử dụng tối thiểu không thể lớn hơn tối đa.'); return; }
    if (maxUse > maxRecommended) { setError('Mức sử dụng thực tế vượt quá ngưỡng an toàn khuyến nghị.'); return; }
    if (categories.includes('cosmetics') && (phMin < 0 || phMax > 14 || phMin > phMax)) {
      setError('Dải pH không hợp lệ (0-14).'); return;
    }

    setLoading(true);
    setError('');

    try {
      const ingredientData = {
        name: { vi: nameVi, en: nameEn },
        inci: inci || null,
        cas: cas || null,
        categories,
        technicalData: {
          solubility,
          physicalForm,
          molecularWeight: molecularWeight || null
        },
        usage: {
          unit,
          min: minUse,
          max: maxUse,
          maxRecommended
        },
        benefits,
        compatibility: { goodWith: [], avoidWith: [] },
        safety: {
          irritationLevel,
          isPregnantSafe
        },
        regulatory: { markets },
        metadata: {
          updatedAt: serverTimestamp(),
          version: "1.0",
          publishedBy: userProfile?.fullName || 'System'
        }
      };

      if (categories.includes('cosmetics')) {
        (ingredientData as any).cosmeticData = {
          phOptimal: { min: phMin, max: phMax }
        };
      }

      const docRef = doc(db, 'ingredients', id);

      if (isEdit) {
        await updateDoc(docRef, ingredientData);
      } else {
        // Check for duplicate ID
        const check = await getDoc(docRef);
        if (check.exists()) {
          setError('ID hoạt chất đã tồn tại. Vui lòng đổi ID hoặc kiểm tra lại.');
          setLoading(false);
          return;
        }
        await setDoc(docRef, { ...ingredientData, metadata: { ...ingredientData.metadata, createdAt: serverTimestamp() } });
      }

      navigate('/ingredient-library');
    } catch (e: any) {
      setError('Lỗi Firebase: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="h-full flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="h-20 shrink-0 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-primary font-display">{isEdit ? 'Cập nhật hoạt chất' : 'Đưa hoạt chất vào hệ thống'}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quy trình kiểm định dữ liệu R&D</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="px-6 h-11 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100">Hủy</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 h-11 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            {loading ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">cloud_upload</span>}
            {isEdit ? 'Lưu thay đổi' : 'Phê duyệt & Lưu'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">

          <div className="lg:col-span-8 space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-4">
                <span className="material-symbols-outlined">error</span> {error}
              </div>
            )}

            {/* Section 1: Identity */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">fingerprint</span>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">1. Định danh hoạt chất</h3>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên (Tiếng Việt)</label>
                    <input value={nameVi} onChange={e => setNameVi(e.target.value)} type="text" placeholder="Ví dụ: Vitamin B3 (Niacinamide)" className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-slate-900 text-sm font-bold placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên (English / Scientific)</label>
                    <input value={nameEn} onChange={e => setNameEn(e.target.value)} type="text" placeholder="Ví dụ: Niacinamide" className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-slate-900 text-sm font-bold placeholder:text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document ID (Slug)</label>
                    <button onClick={() => setIsManualId(!isManualId)} className="text-[10px] font-black text-primary hover:underline">{isManualId ? 'Tự động' : 'Chỉnh sửa ID'}</button>
                  </div>
                  <div className="relative">
                    <input value={id} onChange={e => setId(createSlug(e.target.value))} readOnly={!isManualId} type="text" className={`w-full h-12 px-4 rounded-xl border-none text-sm font-mono font-bold ${isManualId ? 'bg-white ring-1 ring-primary/30 text-slate-900' : 'bg-slate-100 text-slate-400'}`} />
                    {!isManualId && <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-sm">lock</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">INCI Name</label>
                    <input value={inci} onChange={e => setInci(e.target.value)} type="text" placeholder="Ví dụ: Niacinamide" className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-slate-900 text-sm font-bold placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CAS Number</label>
                    <input value={cas} onChange={e => setCas(e.target.value)} type="text" placeholder="Ví dụ: 98-92-0" className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-slate-900 text-sm font-mono font-bold placeholder:text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Tech & Usage */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">analytics</span>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">2. Chỉ số kỹ thuật & Liều dùng</h3>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn vị</label>
                    <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-slate-900 text-sm font-bold appearance-none">
                      <option value="%">% (Cosmetic)</option>
                      <option value="mg/day">mg/day</option>
                      <option value="g/day">g/day</option>
                      <option value="CFU/day">CFU/day</option>
                      <option value="IU/day">IU/day</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Use</label>
                    <input value={minUse} onChange={e => setMinUse(parseFloat(e.target.value))} type="number" className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-slate-900 text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Use</label>
                    <input value={maxUse} onChange={e => setMaxUse(parseFloat(e.target.value))} type="number" className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-slate-900 text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Max Recommended</label>
                    <input value={maxRecommended} onChange={e => setMaxRecommended(parseFloat(e.target.value))} type="number" className="w-full h-12 px-4 rounded-xl bg-rose-50 border-none text-rose-600 text-sm font-bold" />
                  </div>
                </div>

                {categories.includes('cosmetics') && (
                  <div className="p-6 bg-accent-light rounded-2xl border border-accent/10 space-y-4">
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">thermostat</span> Dành cho Mỹ phẩm: Tối ưu pH
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">pH Min</label>
                        <input value={phMin} onChange={e => setPhMin(parseFloat(e.target.value))} type="number" step="0.1" className="w-full h-11 px-4 rounded-lg border-none bg-white text-slate-900 text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">pH Max</label>
                        <input value={phMax} onChange={e => setPhMax(parseFloat(e.target.value))} type="number" step="0.1" className="w-full h-11 px-4 rounded-lg border-none bg-white text-slate-900 text-sm font-bold" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Độ tan</label>
                    <select value={solubility} onChange={e => setSolubility(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-slate-900 text-sm font-bold">
                      <option>Water</option><option>Oil</option><option>Alcohol</option><option>Mixed</option><option>N/A</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái vật lý</label>
                    <select value={physicalForm} onChange={e => setPhysicalForm(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-slate-900 text-sm font-bold">
                      <option>Powder</option><option>Liquid</option><option>Granule</option><option>Emulsion</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trọng lượng phân tử</label>
                    <input value={molecularWeight} onChange={e => setMolecularWeight(e.target.value)} type="text" placeholder="Ví dụ: 122.12 g/mol" className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-slate-900 text-sm font-mono font-bold placeholder:text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Benefits & Safety */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">verified</span> Lợi ích & Tính năng
                </h3>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[50px] p-4 bg-slate-50 rounded-xl">
                  {benefits.map(b => (
                    <span key={b} className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-black text-primary flex items-center gap-2">
                      {b} <button onClick={() => setBenefits(benefits.filter(x => x !== b))} className="material-symbols-outlined text-xs hover:text-rose-500">close</button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <input
                    value={newBenefit}
                    onChange={e => setNewBenefit(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newBenefit) {
                        setBenefits([...benefits, newBenefit.toUpperCase()]);
                        setNewBenefit('');
                      }
                    }}
                    type="text" placeholder="Nhập tag lợi ích (Ví dụ: BRIGHTENING)..." className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-slate-900 text-sm font-bold placeholder:text-slate-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">ENTER</span>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-500">health_and_safety</span> An toàn & Kích ứng
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Mức độ kích ứng (1-10)</label>
                      <span className="text-xl font-black text-primary">{irritationLevel}</span>
                    </div>
                    <input type="range" min="1" max="10" value={irritationLevel} onChange={e => setIrritationLevel(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary" />
                  </div>
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" checked={isPregnantSafe} onChange={e => setIsPregnantSafe(e.target.checked)} className="size-5 rounded border-slate-300 text-primary focus:ring-primary/20" />
                    <span className="text-sm font-bold text-slate-700">An toàn cho phụ nữ mang thai</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* Category Selector */}
            <div className="bg-[#0B3C49] rounded-[2rem] p-8 text-white shadow-xl shadow-primary/20">
              <h3 className="text-[11px] font-black text-accent-light/50 uppercase tracking-widest mb-6">Phân loại hệ thống</h3>
              <div className="space-y-3">
                {[
                  { id: 'cosmetics', label: 'Mỹ phẩm', desc: 'Bôi ngoài da' },
                  { id: 'supplements', label: 'Thực phẩm BVSK', desc: 'Đường uống / Vitamin' },
                  { id: 'functional_food', label: 'TP Chức năng', desc: 'Thực phẩm bổ sung' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`w-full p-4 rounded-2xl flex items-start gap-4 transition-all text-left border ${categories.includes(cat.id) ? 'bg-white/10 border-accent/40 shadow-inner' : 'bg-transparent border-white/10 hover:bg-white/5'}`}
                  >
                    <div className={`size-5 rounded border-2 flex items-center justify-center mt-1 transition-all ${categories.includes(cat.id) ? 'bg-accent border-accent' : 'border-white/30'}`}>
                      {categories.includes(cat.id) && <span className="material-symbols-outlined text-white text-[16px] font-black">check</span>}
                    </div>
                    <div>
                      <p className="text-sm font-black">{cat.label}</p>
                      <p className="text-[10px] text-white/40 font-bold">{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Regulatory Markets */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">public</span> Thị trường cho phép
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {['VN', 'EU', 'US', 'ASEAN', 'CHINA', 'JP'].map(market => (
                  <button
                    key={market}
                    onClick={() => {
                      setMarkets(markets.includes(market) ? markets.filter(m => m !== market) : [...markets, market]);
                    }}
                    className={`h-11 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${markets.includes(market) ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    {market}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100">
              <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">lightbulb</span> Checklist không vỡ dữ liệu
              </h4>
              <ul className="space-y-3">
                {[
                  'ID slug phải duy nhất trong hệ thống.',
                  'CAS number ưu tiên định dạng d-d-d.',
                  'Mỹ phẩm bắt buộc có dải pH ổn định.',
                  'BVSK ưu tiên đơn vị mg/day hoặc CFU.'
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-amber-800 font-medium">
                    <span className="text-amber-400 font-black">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AddIngredient;
