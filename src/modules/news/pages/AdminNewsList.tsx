
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../../../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { createSystemLog } from '../../../services/Logger';

interface Article {
  id: string;
  category: string;
  title: string;
  date: string;
  img: string;
  author?: string;
  status?: 'published' | 'hidden';
}

const NewsManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, title: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tenantId) return;
    const q = query(collection(db, 'news'), where('tenantId', '==', tenantId), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];
      setArticles(data);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi Realtime Firestore:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const confirmDelete = async () => {
    if (!deleteTarget || !auth.currentUser) return;

    setActionLoading(deleteTarget.id);
    try {
      const targetTitle = deleteTarget.title;
      const docRef = doc(db, 'news', deleteTarget.id);
      await deleteDoc(docRef);

      // Ghi log xóa bài viết
      await createSystemLog('DELETE', 'NEWS', `Xóa vĩnh viễn bài viết: ${targetTitle}`, userProfile, 'high');

      setDeleteTarget(null);
    } catch (error: any) {
      console.error("Lỗi Firestore khi xóa:", error);
      alert("KHÔNG THỂ XÓA\nLỗi: " + (error.code === 'permission-denied' ? "Quyền truy cập bị từ chối." : error.message));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVisibility = async (e: React.MouseEvent, article: Article) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser) return alert("Vui lòng đăng nhập.");

    const newStatus = article.status === 'hidden' ? 'published' : 'hidden';
    const statusLabel = newStatus === 'published' ? 'Công khai' : 'Tạm ẩn';

    setActionLoading(article.id);

    try {
      await updateDoc(doc(db, 'news', article.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Ghi log thay đổi trạng thái
      await createSystemLog('UPDATE', 'NEWS', `${statusLabel} bài viết: ${article.title}`, userProfile, 'low');

    } catch (error: any) {
      console.error("Lỗi cập nhật trạng thái:", error);
      alert("Lỗi: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 relative">
      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="size-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl filled-icon">warning</span>
              </div>
              <h3 className="text-2xl font-black text-primary font-display mb-2 uppercase tracking-tight">Xác nhận xóa?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                Bạn đang thực hiện xóa vĩnh viễn bài viết: <br />
                <span className="text-rose-500 font-bold">"{deleteTarget.title}"</span>. <br />
                Hành động này không thể khôi phục.
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
                disabled={actionLoading === deleteTarget.id}
                className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">QUẢN LÝ TIN TỨC</h2>
          <p className="text-slate-500 font-medium">Trung tâm điều phối nội dung và tri thức R&D.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/manage-categories" className="h-11 px-6 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">category</span> Chuyên mục
          </Link>
          <Link to="/manage-tags" className="h-11 px-6 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">tag</span> Hashtag
          </Link>
          <Link to="/edit-news" className="h-11 px-6 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-xl">add_circle</span> Viết bài
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Bài viết</th>
                <th className="px-6 py-5">Trạng thái</th>
                <th className="px-6 py-5">Chuyên mục</th>
                <th className="px-6 py-5">Ngày đăng</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center italic text-slate-400">Đang tải dữ liệu...</td></tr>
              ) : articles.length > 0 ? (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img src={article.img} className="size-12 rounded-lg object-cover bg-slate-100 shrink-0" alt={article.title} />
                        <div>
                          <p className="font-bold text-primary truncate max-w-[250px]">{article.title}</p>
                          <p className="text-[9px] font-mono text-slate-300">ID: {article.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {article.status === 'hidden' ? (
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                          Tạm ẩn
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                          Công khai
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2 py-1 rounded bg-accent-light text-accent text-[10px] font-black uppercase tracking-widest">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-medium">{article.date}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => toggleVisibility(e, article)}
                          disabled={actionLoading === article.id}
                          className={`size-9 flex items-center justify-center rounded-lg transition-all ${article.status === 'hidden'
                            ? 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                            : 'text-emerald-500 hover:text-slate-400 hover:bg-slate-100'
                            }`}
                          title={article.status === 'hidden' ? "Hiện bài viết" : "Ẩn bài viết"}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {article.status === 'hidden' ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/edit-news/${article.id}`); }}
                          className="size-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget({ id: article.id, title: article.title });
                          }}
                          disabled={actionLoading === article.id}
                          className={`size-9 flex items-center justify-center rounded-lg transition-all ${actionLoading === article.id
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer'
                            }`}
                          title="Xóa bài viết"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-20 text-center italic text-slate-400">Chưa có bài viết nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;
