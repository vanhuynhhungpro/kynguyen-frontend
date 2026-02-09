
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

const IngredientLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  // Doctor & Admin có quyền quản lý kỹ thuật
  const canManage = userProfile?.role === 'doctor' || userProfile?.role === 'admin';

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // States cho việc xóa
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'ingredients'), orderBy('name.en', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIngredients(data);
      setLoading(false);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    }, (error) => {
      console.error("Lỗi tải dữ liệu:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedId]);

  const filteredIngredients = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return ingredients.filter(ing => {
      const nameVi = typeof ing.name === 'object' ? ing.name.vi : '';
      const nameEn = typeof ing.name === 'object' ? ing.name.en : (ing.name || '');
      return nameVi.toLowerCase().includes(lowerQuery) || nameEn.toLowerCase().includes(lowerQuery) || (ing.inci || '').toLowerCase().includes(lowerQuery);
    });
  }, [ingredients, searchQuery]);

  const selected = useMemo(() => {
    if (!selectedId) return ingredients[0] || null;
    return ingredients.find(i => i.id === selectedId) || ingredients[0] || null;
  }, [ingredients, selectedId]);

  const confirmDelete = async () => {
    if (!deleteTarget || !canManage) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'ingredients', deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    } catch (e) {
      console.error("Lỗi khi xóa:", e);
      alert("Đã xảy ra lỗi khi xóa hoạt chất.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getIngredientName = (ing: any) => {
    if (!ing) return '';
    return typeof ing.name === 'object' ? ing.name.vi || ing.name.en : ing.name;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-light">

      {/* Popup xác nhận xóa hoạt chất */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="size-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="material-symbols-outlined text-4xl filled-icon">warning</span>
              </div>
              <h3 className="text-2xl font-black text-primary font-display mb-2 uppercase tracking-tight">Xóa hoạt chất?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                Bạn sắp xóa vĩnh viễn hoạt chất <span className="text-rose-600 font-bold">"{deleteTarget.name}"</span> khỏi thư viện R&D.
                Hành động này có thể ảnh hưởng đến các dự án đang sử dụng hoạt chất này.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                {isDeleting ? <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span> : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-bold text-primary font-display tracking-tight">Thư viện hoạt chất</h2>
          <div className="relative w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium"
              placeholder="Tìm theo tên, INCI..."
            />
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/add-ingredient')} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg">
              <span className="material-symbols-outlined text-[20px]">add</span> Thêm hoạt chất
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden p-8 flex gap-8">
        {/* Sidebar List */}
        <div className="w-[420px] space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100"></div>)}
            </div>
          ) : filteredIngredients.map(ing => (
            <div
              key={ing.id}
              onClick={() => setSelectedId(ing.id)}
              className={`bg-white p-6 rounded-3xl border transition-all cursor-pointer relative group ${selectedId === ing.id ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'border-slate-100 hover:border-primary/40'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="max-w-[80%]">
                  <h3 className="text-lg font-bold text-primary truncate font-display">{getIngredientName(ing)}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">ID: {ing.id}</p>
                </div>
                {canManage && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/add-ingredient?id=${ing.id}`); }} className="size-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:text-primary" title="Chỉnh sửa"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: ing.id, name: getIngredientName(ing) }); }} className="size-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:text-rose-500" title="Xóa"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-50 pt-4">
                <span>Nồng độ: {ing.usage?.min}-{ing.usage?.max}%</span>
                <span className={ing.safety?.irritationLevel <= 3 ? 'text-emerald-500' : 'text-amber-500'}>An toàn: {10 - (ing.safety?.irritationLevel || 0)}/10</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-card flex flex-col h-full overflow-hidden">
          {selected ? (
            <>
              <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex justify-between items-start">
                <div className="flex gap-8">
                  <div className="size-20 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-soft">
                    <span className="material-symbols-outlined text-4xl text-primary filled-icon">science</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-primary font-display mb-1">{getIngredientName(selected)}</h2>
                    <p className="text-xs text-slate-400 font-mono">INCI: {selected.inci || 'N/A'}</p>
                    <div className="flex gap-2 mt-4">
                      {selected.categories?.map((c: string) => <span key={c} className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-md">{c}</span>)}
                    </div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-3">
                    <button onClick={() => navigate(`/add-ingredient?id=${selected.id}`)} className="h-11 px-6 bg-slate-100 text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">edit</span> Chỉnh sửa</button>
                    <button onClick={() => setDeleteTarget({ id: selected.id, name: getIngredientName(selected) })} className="h-11 px-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all flex items-center gap-2" title="Xóa"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <section>
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">Mô tả và công dụng</h4>
                  <div className="bg-slate-50 p-6 rounded-2xl text-slate-600 leading-relaxed font-medium">
                    {selected.description || "Dữ liệu đang được đội ngũ Doctor cập nhật từ các báo cáo lâm sàng mới nhất."}
                  </div>
                </section>
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Liều dùng khuyến nghị</p>
                    <p className="text-3xl font-black text-primary">{selected.usage?.min || 0}-{selected.usage?.max || 0}%</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Độ tan (Solubility)</p>
                    <p className="text-2xl font-black text-primary uppercase">{selected.technicalData?.solubility || 'Water'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <span className="material-symbols-outlined text-8xl mb-4 opacity-10">biotech</span>
              <p className="font-display font-black uppercase tracking-widest text-slate-400">Chọn hoạt chất để tra cứu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IngredientLibrary;
