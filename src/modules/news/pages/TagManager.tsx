
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';

interface Tag {
  id: string;
  name: string;
}

const TagManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'news_tags'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Tag[];
      setTags(data);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi listen tags:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || processing) return;

    setProcessing(true);
    const cleanName = trimmed
      .replace(/^#+/, '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'D')
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
    
    try {
      if (tags.some(t => t.name === cleanName)) {
        alert("Hashtag này đã tồn tại!");
        setProcessing(false);
        return;
      }

      await addDoc(collection(db, 'news_tags'), { 
        name: cleanName, 
        createdAt: serverTimestamp() 
      });
      await createSystemLog('CREATE', 'NEWS', `Tạo hashtag mới: #${cleanName}`, userProfile, 'low');
      setNewName('');
    } catch (error: any) {
      console.error("Error adding tag:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    try {
      await deleteDoc(doc(db, 'news_tags', tag.id));
      await createSystemLog('DELETE', 'NEWS', `Xóa hashtag: #${tag.name}`, userProfile, 'low');
    } catch (error: any) {
      alert("Lỗi khi xóa tag: " + error.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 text-left">
        <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">Quản lý Hashtag</h2>
        <p className="text-slate-500 font-medium">Gắn thẻ các hoạt chất, công nghệ để liên kết dữ liệu bài viết.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card mb-10">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">#</span>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="TEN_HOAT_CHAT_MOI..."
              disabled={processing}
              className="w-full h-14 pl-10 pr-5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/10 text-sm font-bold text-primary uppercase transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={processing || !newName.trim()}
            className="h-14 px-8 bg-primary text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
          >
            {processing ? (
              <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">add_circle</span>
            )}
            Thêm Tag
          </button>
        </form>
        <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1 italic">* Tự động chuyển thành viết hoa không dấu, ví dụ: "Nano Liposome" {'->'} "NANO_LIPOSOME"</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">label</span> Danh sách thẻ hiện có ({tags.length})
        </h4>
        
        {loading ? (
          <div className="flex flex-wrap gap-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-10 w-24 bg-slate-100 rounded-xl"></div>)}
          </div>
        ) : tags.length > 0 ? (
          <div className="flex flex-wrap gap-3 pb-20">
            {tags.map(tag => (
              <div 
                key={tag.id} 
                className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-soft hover:border-primary/40 hover:shadow-md transition-all duration-300"
              >
                <span className="text-xs font-black text-primary tracking-tight">#{tag.name}</span>
                <button 
                  onClick={() => handleDelete(tag)} 
                  className="material-symbols-outlined text-slate-300 hover:text-rose-500 text-[18px] transition-colors"
                  title="Xóa thẻ"
                >
                  close
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
             <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">tag_off</span>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Chưa có hashtag nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagManagement;
