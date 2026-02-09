
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';

interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt?: any;
}

const CategoryManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'news_categories'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(data);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi listen categories:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName || processing) return;

    setProcessing(true);
    const slug = trimmedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      if (editingId) {
        await updateDoc(doc(db, 'news_categories', editingId), {
          name: trimmedName,
          slug,
          updatedAt: serverTimestamp()
        });
        await createSystemLog('UPDATE', 'NEWS', `Cập nhật tên chuyên mục tin tức: ${trimmedName}`, userProfile, 'low');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'news_categories'), {
          name: trimmedName,
          slug,
          createdAt: serverTimestamp()
        });
        await createSystemLog('CREATE', 'NEWS', `Thêm chuyên mục tin tức mới: ${trimmedName}`, userProfile, 'low');
      }
      setNewName('');
    } catch (error: any) {
      console.error("Error managing category:", error);
    } finally {
      setProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setActionLoading(deleteTarget.id);
    try {
      const targetName = deleteTarget.name;
      await deleteDoc(doc(db, 'news_categories', deleteTarget.id));
      await createSystemLog('DELETE', 'NEWS', `Xóa chuyên mục tin tức: ${targetName}`, userProfile, 'medium');
      setDeleteTarget(null);
    } catch (error: any) {
      console.error("Lỗi khi xóa:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500 relative">
      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="size-20 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl filled-icon">warning</span>
              </div>
              <h3 className="text-2xl font-black text-primary font-display mb-2 uppercase tracking-tight">Xóa chuyên mục?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                Bạn sắp xóa chuyên mục: <br />
                <span className="text-primary font-bold">"{deleteTarget.name}"</span>. <br />
                Các bài viết thuộc chuyên mục này sẽ không bị xóa nhưng cần được gán lại chuyên mục mới.
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
                disabled={!!actionLoading}
                className="flex-1 h-12 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {actionLoading === deleteTarget.id ? (
                  <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                ) : (
                  'Xác nhận xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">Quản lý chuyên mục tin</h2>
        <p className="text-slate-500 font-medium">Tạo danh mục cho tin tức (VD: Thị trường, Phong thủy, Kiến thức...).</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card mb-8">
        <form onSubmit={handleAddOrUpdate} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên chuyên mục</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ví dụ: Tin thị trường, Phong thủy..."
              className="w-full h-12 px-5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/10 text-sm font-bold text-primary transition-all"
              disabled={processing}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={processing || !newName.trim()}
              className="h-12 px-8 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {processing ? (
                <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">{editingId ? 'save' : 'add'}</span>
              )}
              {editingId ? 'Cập nhật' : 'Thêm mới'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNewName(''); }}
                className="h-12 px-4 text-slate-400 font-bold text-xs uppercase underline hover:text-rose-500"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-5">Tên chuyên mục</th>
              <th className="px-8 py-5">Slug SEO</th>
              <th className="px-8 py-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={3} className="p-20 text-center italic text-slate-400">
                <span className="animate-spin material-symbols-outlined text-primary mb-2">progress_activity</span>
                <p>Đang tải dữ liệu...</p>
              </td></tr>
            ) : categories.length > 0 ? (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 font-bold text-primary">{cat.name}</td>
                  <td className="px-8 py-5 font-mono text-xs text-slate-400">{cat.slug}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => startEdit(cat)}
                        className="size-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-none hover:shadow-sm"
                        title="Sửa"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                        className="size-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="p-20 text-center italic text-slate-400">Chưa có chuyên mục nào được tạo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryManagement;
