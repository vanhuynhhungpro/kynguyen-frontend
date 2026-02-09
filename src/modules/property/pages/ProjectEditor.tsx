
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, addDoc, getDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';

interface Ingredient {
  id: string;
  name: string;
  cas: string;
  role: string;
  function: string;
  conc: number;
  status: string;
  statusColor: string;
  color: string;
  warning?: boolean;
}

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const fromTrend = searchParams.get('fromTrend');
  const isEdit = !!projectId;
  const { userProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');
  
  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [projectInfo, setProjectInfo] = useState({
    name: fromTrend ? `Nghiên cứu ứng dụng ${fromTrend}` : '',
    code: 'PRJ-' + Math.floor(Math.random() * 9000 + 1000),
    progress: 0,
    createdDate: new Date().toISOString().split('T')[0],
    status: 'Đang nghiên cứu',
    creator: userProfile?.fullName || 'Lê Ngọc Dũng',
    hasLegal: false,
    mainBenefits: fromTrend ? `Phát triển sản phẩm dựa trên xu hướng thị trường về ${fromTrend}` : ''
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [newLog, setNewLog] = useState('');

  const statusOptions = ['Bản nháp', 'Đang nghiên cứu', 'Đang thử nghiệm', 'Chờ duyệt', 'Đã duyệt'];

  // Helper to get status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bản nháp':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'Đang nghiên cứu':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Đang thử nghiệm':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Chờ duyệt':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Đã duyệt':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (isEdit && projectId) {
        try {
          const docRef = doc(db, 'projects', projectId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProjectInfo({
              name: data.name || '',
              code: data.code || '',
              progress: data.progress || 0,
              createdDate: data.createdDate || new Date().toISOString().split('T')[0],
              status: data.status || 'Đang nghiên cứu',
              creator: data.creator || '',
              hasLegal: data.hasLegal || false,
              mainBenefits: data.mainBenefits || ''
            });
            if (data.ingredients) setIngredients(data.ingredients);
            if (data.logs) setLogs(data.logs);
          }
        } catch (err) {
          console.error("Error fetching project:", err);
          setError("Không thể tải thông tin dự án.");
        } finally {
          setFetching(false);
        }
      } else {
        const defaultIngs: Ingredient[] = [
          { id: 'HA', name: 'HYALURONIC ACID (LMW)', cas: '9004-61-9', role: 'Active', function: 'Cấp ẩm sâu', conc: 1.5, status: 'An toàn', statusColor: 'bg-emerald-50 text-emerald-600', color: 'bg-blue-100 text-blue-600' }
        ];

        if (fromTrend) {
          defaultIngs.push({
            id: 'TREND-ACT',
            name: fromTrend.toUpperCase(),
            cas: 'N/A',
            role: 'Active (Trend)',
            function: 'Hoạt chất xu hướng thị trường',
            conc: 1.0,
            status: 'Cần thẩm định',
            statusColor: 'bg-amber-50 text-amber-600',
            color: 'bg-primary/10 text-primary'
          });
          setLogs([{ date: new Date().toLocaleString(), content: `Bắt đầu dự án nghiên cứu từ xu hướng thị trường: ${fromTrend}` }]);
        }
        
        setIngredients(defaultIngs);
        setFetching(false);
      }
    };

    fetchProject();
  }, [projectId, fromTrend, isEdit]);

  const handleSaveProject = async () => {
    if (!projectInfo.name) {
      setError('Vui lòng nhập tên dự án');
      return;
    }
    setLoading(true);
    try {
      const projectData = {
        ...projectInfo,
        ingredients: ingredients,
        logs: logs,
        ownerId: userProfile?.uid || 'anonymous',
        updatedAt: serverTimestamp(),
      };
      if (isEdit && projectId) {
        await updateDoc(doc(db, 'projects', projectId), projectData);
        await createSystemLog('UPDATE', 'PROJECT', `Cập nhật dự án ${projectInfo.code}: ${projectInfo.name}`, userProfile, 'medium');
      } else {
        await addDoc(collection(db, 'projects'), { ...projectData, createdAt: serverTimestamp() });
        await createSystemLog('CREATE', 'PROJECT', `Khởi tạo dự án nghiên cứu mới: ${projectInfo.name}`, userProfile, 'medium');
      }
      navigate('/my-projects');
    } catch (err: any) {
      setError('Đã có lỗi xảy ra khi lưu dự án.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!isEdit || !projectId) return;
    
    setLoading(true);
    try {
      const projectName = projectInfo.name;
      const projectCode = projectInfo.code;
      await deleteDoc(doc(db, 'projects', projectId));
      await createSystemLog('DELETE', 'PROJECT', `Xóa vĩnh viễn dự án ${projectCode}: ${projectName}`, userProfile, 'high');
      navigate('/my-projects');
    } catch (err: any) {
      console.error("Error deleting project:", err);
      setError("Không thể xóa dự án. Vui lòng thử lại sau.");
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddLog = () => {
    if (!newLog.trim()) return;
    setLogs([{ date: new Date().toLocaleString('vi-VN'), content: newLog }, ...logs]);
    setNewLog('');
  };

  const removeIngredient = (id: string) => setIngredients(ingredients.filter(ing => ing.id !== id));

  const updateIngredientConc = (id: string, val: string) => {
    const num = parseFloat(val) || 0;
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, conc: num } : ing));
  };

  if (fetching) return <div className="flex h-full items-center justify-center"><span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span></div>;

  return (
    <div className="flex h-full overflow-hidden bg-slate-50/30">
      
      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="size-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="material-symbols-outlined text-4xl filled-icon">warning</span>
              </div>
              <h3 className="text-2xl font-black text-primary font-display mb-2 uppercase tracking-tight">Xác nhận xóa dự án?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                Bạn sắp xóa vĩnh viễn dự án <span className="text-rose-600 font-bold">"{projectInfo.name}"</span>. 
                Mọi dữ liệu nghiên cứu và công thức sẽ bị mất và không thể khôi phục.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleDeleteProject}
                disabled={loading}
                className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                ) : (
                  'Xác nhận xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth custom-scrollbar">
        <div className="max-w-[1000px] mx-auto w-full pb-24 space-y-10">
          <div className="flex items-start justify-between">
             <div className="space-y-1">
               <h2 className="text-3xl font-black text-[#0B3C49] font-display tracking-tight uppercase">
                 {isEdit ? 'CẬP NHẬT DỰ ÁN' : 'THIẾT LẬP DỰ ÁN MỚI'}
               </h2>
               <p className="text-slate-500 font-medium italic">Giai đoạn nghiên cứu hiện tại: {projectInfo.status}</p>
             </div>
             <div className="flex items-center gap-3">
               <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border shadow-sm transition-all duration-300 ${getStatusColor(projectInfo.status)}`}>
                 {projectInfo.status}
               </span>
             </div>
          </div>

          <div className="h-px bg-slate-200 w-full"></div>

          {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2"><span className="material-symbols-outlined">error</span>{error}</div>}

          <section className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
            <div className="px-8 py-5 bg-[#0B3C49] text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-accent text-[22px] filled-icon">info</span>
              <h3 className="font-black text-[12px] uppercase tracking-[0.2em]">SECTION 1: THÔNG TIN DỰ ÁN</h3>
            </div>
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tên dự án */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên dự án <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    autoComplete="off"
                    value={projectInfo.name} 
                    onChange={(e) => setProjectInfo({...projectInfo, name: e.target.value})} 
                    className="w-full h-12 px-5 rounded-2xl border-none bg-slate-100/80 text-[#0B3C49] font-bold text-sm focus:ring-4 focus:ring-accent/10 focus:bg-white transition-all outline-none" 
                    placeholder="Nhập tên dự án..."
                  />
                </div>
                
                {/* Mã dự án */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã dự án (Tự động)</label>
                  <input type="text" value={projectInfo.code} readOnly className="w-full h-12 px-5 rounded-2xl border-none bg-slate-100/30 text-slate-400 font-bold font-mono text-sm cursor-not-allowed outline-none" />
                </div>

                {/* Trạng thái dự án */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái hiện tại</label>
                  <div className="relative">
                    <select 
                      value={projectInfo.status} 
                      onChange={(e) => setProjectInfo({...projectInfo, status: e.target.value})} 
                      className={`w-full h-12 px-5 rounded-2xl border font-bold text-sm focus:ring-4 focus:ring-accent/10 focus:bg-white transition-all outline-none cursor-pointer pr-10 ${getStatusColor(projectInfo.status)}`}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-white text-slate-900 font-medium">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ngày tạo dự án */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày khởi tạo</label>
                  <input 
                    type="date" 
                    value={projectInfo.createdDate} 
                    onChange={(e) => setProjectInfo({...projectInfo, createdDate: e.target.value})} 
                    className="w-full h-12 px-5 rounded-2xl border-none bg-slate-100/80 text-[#0B3C49] font-bold text-sm focus:ring-4 focus:ring-accent/10 focus:bg-white transition-all outline-none" 
                  />
                </div>

                {/* Pháp lý Checkbox */}
                <div className="col-span-full py-4 border-t border-slate-50">
                  <label className="flex items-center gap-4 cursor-pointer group w-fit">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={projectInfo.hasLegal} 
                        onChange={(e) => setProjectInfo({...projectInfo, hasLegal: e.target.checked})} 
                        className="peer sr-only"
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-accent/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary group-hover:text-accent transition-colors">Đã hoàn thiện hồ sơ pháp lý (ISO/GMP)</span>
                      <span className="text-[10px] text-slate-400 font-medium">Bật nếu dự án đã có đầy đủ giấy tờ công bố và kiểm định.</span>
                    </div>
                  </label>
                </div>

                {/* Mục tiêu công dụng */}
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mục tiêu công dụng & Mô tả dự án</label>
                  <textarea 
                    value={projectInfo.mainBenefits} 
                    onChange={(e) => setProjectInfo({...projectInfo, mainBenefits: e.target.value})} 
                    className="w-full p-5 rounded-3xl border-none bg-slate-100/80 text-[#0B3C49] font-bold text-sm focus:ring-4 focus:ring-accent/10 focus:bg-white transition-all min-h-[120px] outline-none" 
                    placeholder="Mô tả chi tiết mục tiêu của công thức này..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
            <div className="px-8 py-5 bg-[#0B3C49] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-accent text-[22px] filled-icon">science</span>
                <h3 className="font-black text-[12px] uppercase tracking-[0.2em]">SECTION 2: CÔNG THỨC SƠ BỘ</h3>
              </div>
              <button 
                onClick={() => navigate('/ingredient-library')} 
                className="text-[10px] font-black text-white bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 border border-white/20 transition-all"
              >
                Thư viện hoạt chất
              </button>
            </div>
            <div className="p-0 overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
                    <tr><th className="px-10 py-5">Tên hoạt chất</th><th className="px-4 py-5">Nồng độ (%)</th><th className="px-4 py-5">Trạng thái</th><th className="px-6 py-5 text-right">Xóa</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ingredients.length > 0 ? (
                      ingredients.map((ing) => (
                        <tr key={ing.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-10 py-6"><p className="font-black text-[#0B3C49] text-sm">{ing.name}</p><p className="text-[10px] text-slate-400 font-black tracking-widest">CAS: {ing.cas}</p></td>
                          <td className="px-4 py-6"><input type="number" value={ing.conc} onChange={(e) => updateIngredientConc(ing.id, e.target.value)} className="w-20 bg-slate-100 border-none rounded-lg h-9 text-center text-slate-900 text-sm font-black focus:ring-2 focus:ring-accent/20" step="0.1" /></td>
                          <td className="px-4 py-6"><span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${ing.statusColor}`}>{ing.status}</span></td>
                          <td className="px-6 py-6 text-right"><button onClick={() => removeIngredient(ing.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><span className="material-symbols-outlined text-[22px]">delete</span></button></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-10 py-12 text-center text-slate-400 italic">Chưa có hoạt chất nào trong công thức.</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
            <div className="px-8 py-5 bg-[#0B3C49] text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-accent text-[22px] filled-icon">history_edu</span>
              <h3 className="font-black text-[12px] uppercase tracking-[0.2em]">SECTION 3: NHẬT KÝ NGHIÊN CỨU</h3>
            </div>
            <div className="p-10 space-y-6">
              <textarea value={newLog} onChange={(e) => setNewLog(e.target.value)} className="w-full p-5 rounded-2xl border-none bg-slate-100/80 text-slate-900 min-h-[100px] outline-none focus:ring-4 focus:ring-accent/10" placeholder="Thêm nhật ký quan sát mới..." />
              <button onClick={handleAddLog} className="px-6 h-12 rounded-xl bg-accent text-white font-black text-[11px] uppercase tracking-widest hover:bg-accent/90 transition-all shadow-md shadow-accent/20">Lưu nhật ký</button>
              <div className="space-y-4 pt-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {logs.length > 0 ? (
                  logs.map((log, idx) => (<div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 animate-in fade-in slide-in-from-top-2"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">{log.date}</p><p className="text-sm text-slate-600 font-medium">{log.content}</p></div>))
                ) : (
                  <p className="text-slate-400 text-xs italic text-center py-4">Chưa có nhật ký hoạt động.</p>
                )}
              </div>
            </div>
          </section>

          <div className="pt-10 flex items-center justify-between border-t border-slate-200">
             <div className="flex gap-4">
               <button onClick={() => navigate('/my-projects')} className="px-8 h-12 rounded-2xl border border-slate-200 text-slate-500 font-black text-[12px] uppercase hover:bg-slate-50 transition-all">Hủy & Quay lại</button>
               {isEdit && (
                 <button 
                  onClick={() => setShowDeleteModal(true)} 
                  disabled={loading}
                  className="px-6 h-12 rounded-2xl border border-rose-200 text-rose-500 font-black text-[12px] uppercase hover:bg-rose-50 transition-all flex items-center gap-2 group"
                 >
                   <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">delete</span>
                   Xóa dự án
                 </button>
               )}
             </div>
             <button onClick={handleSaveProject} disabled={loading} className="px-12 h-14 rounded-2xl bg-[#0B3C49] text-white font-black text-[13px] uppercase tracking-[0.15em] shadow-2xl shadow-[#0B3C49]/20 flex items-center gap-3 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50">
               {loading ? (
                 <>
                  <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  ĐANG XỬ LÝ...
                 </>
               ) : (
                 <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  {isEdit ? 'CẬP NHẬT DỰ ÁN' : 'TẠO DỰ ÁN MỚI'}
                 </>
               )}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
