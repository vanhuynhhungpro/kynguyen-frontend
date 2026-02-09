
import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, setDoc, deleteDoc, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth, UserRole } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { createSystemLog } from '../../../services/Logger';

interface UserData {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  accountType?: string;
  company?: string;
  phone?: string;
  createdAt: any;
}

const UserManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { tenantId } = useBranding();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Form States
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'user' as UserRole, company: '', phone: '' });
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const q = query(collection(db, 'users'), where('tenantId', '==', tenantId), orderBy('fullName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.company?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleRoleChange = async (uid: string, newRole: string) => {
    if (uid === userProfile?.uid) {
      alert("Bạn không thể tự thay đổi quyền hạn của chính mình.");
      return;
    }

    const userToUpdate = users.find(u => u.uid === uid);
    const oldRole = userToUpdate?.role;

    setUpdatingId(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        roleUpdatedAt: serverTimestamp()
      });
      await createSystemLog('UPDATE', 'USER', `Thay đổi vai trò người dùng ${userToUpdate?.fullName} từ ${oldRole} sang ${newRole}`, userProfile, 'high');
    } catch (error) {
      console.error("Update role failed:", error);
      alert("Lỗi khi cập nhật quyền hạn.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);
    try {
      const tempId = `user_${Date.now()}`;
      await setDoc(doc(db, 'users', tempId), {
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        company: newUser.company,
        phone: newUser.phone,
        createdAt: serverTimestamp(),
        tenantId,
        accountType: 'Thành viên hệ thống'
      });
      await createSystemLog('CREATE', 'USER', `Admin tạo hồ sơ nhân viên mới: ${newUser.fullName} (${newUser.role})`, userProfile, 'medium');
      setShowAddModal(false);
      setNewUser({ fullName: '', email: '', password: '', role: 'user', company: '', phone: '' });
      alert("Đã tạo hồ sơ người dùng trong hệ thống dữ liệu.");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const targetName = selectedUser.fullName;
      await deleteDoc(doc(db, 'users', selectedUser.uid));
      await createSystemLog('DELETE', 'USER', `Xóa vĩnh viễn người dùng: ${targetName}`, userProfile, 'high');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err: any) {
      alert("Lỗi khi xóa: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, selectedUser.email);
      await createSystemLog('UPDATE', 'USER', `Gửi email khôi phục mật khẩu cho ${selectedUser.fullName}`, userProfile, 'low');
      alert(`Một email hướng dẫn đặt lại mật khẩu đã được gửi tới hòm thư: ${selectedUser.email}`);
      setShowPasswordModal(false);
    } catch (err: any) {
      console.error("Reset Email Error:", err);
      if (err.code === 'auth/user-not-found') {
        alert("Lỗi: Email này chưa được đăng ký trong hệ thống Authentication.");
      } else {
        alert("Lỗi: " + err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'doctor': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'marketing': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 relative min-h-full">

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-primary font-display uppercase tracking-tight">Thêm thành viên mới</h3>
              <button onClick={() => setShowAddModal(false)} className="size-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleAddUser} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <input required value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-slate-900" type="text" placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email đăng nhập</label>
                <input required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-slate-900" type="email" placeholder="email@company.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vai trò hệ thống</label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-900">
                    <option value="user">USER</option>
                    <option value="marketing">MARKETING</option>
                    <option value="doctor">DOCTOR</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Công ty</label>
                  <input value={newUser.company} onChange={e => setNewUser({ ...newUser, company: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-slate-50 border-none text-sm font-bold text-slate-900" type="text" placeholder="Tên công ty" />
                </div>
              </div>
              {formError && <p className="text-rose-500 text-xs font-bold">{formError}</p>}
              <button disabled={actionLoading} type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2">
                {actionLoading ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : <span className="material-symbols-outlined">person_add</span>}
                Lưu hồ sơ thành viên
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-10 text-center">
              <div className="size-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="material-symbols-outlined text-4xl filled-icon">warning</span>
              </div>
              <h3 className="text-2xl font-black text-primary font-display mb-2 uppercase tracking-tight">Xác nhận xóa tài khoản?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                Bạn sắp xóa vĩnh viễn hồ sơ của <span className="text-rose-600 font-bold">{selectedUser.fullName}</span> khỏi hệ thống dữ liệu.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all">Hủy bỏ</button>
              <button onClick={handleDeleteUser} disabled={actionLoading} className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">
                {actionLoading ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND RESET EMAIL MODAL */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="size-20 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="material-symbols-outlined text-4xl">mail</span>
              </div>
              <h3 className="text-2xl font-black text-primary font-display mb-2 uppercase tracking-tight">Gửi email khôi phục?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                Hệ thống sẽ gửi một liên kết đổi mật khẩu tới địa chỉ: <br /><strong>{selectedUser.email}</strong>. <br />Người dùng sẽ tự thực hiện việc thay đổi mật khẩu của mình.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all">Đóng</button>
              <button onClick={handleSendResetEmail} disabled={actionLoading} className="flex-1 h-12 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                {actionLoading ? "Đang gửi..." : "Xác nhận gửi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">QUẢN LÝ TÀI KHOẢN</h2>
          <p className="text-slate-500 font-medium">Phân quyền và kiểm soát truy cập hệ thống LUCE BIO TECH.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, email..."
              className="w-full h-12 pl-12 pr-5 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm font-medium outline-none text-slate-900"
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="h-12 px-6 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2 whitespace-nowrap">
            <span className="material-symbols-outlined">person_add</span>
            Thêm hồ sơ
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-card border border-slate-100 overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Người dùng</th>
                <th className="px-6 py-5">Thông tin doanh nghiệp</th>
                <th className="px-6 py-5">Vai trò hệ thống</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center italic text-slate-400">Đang tải danh sách người dùng...</td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-11 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-slate-400 uppercase">
                          {user.fullName.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-primary">{user.fullName}</p>
                          <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-slate-700 font-bold">{user.company || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.accountType || 'Thành viên'}</p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRoleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                        {updatingId === user.uid ? (
                          <span className="animate-spin material-symbols-outlined text-primary text-sm">progress_activity</span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                            disabled={user.uid === userProfile?.uid}
                            className="h-8 pl-2 pr-8 rounded-lg bg-slate-50 border-none text-[9px] font-black uppercase tracking-widest text-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer disabled:opacity-30"
                          >
                            <option value="user">USER</option>
                            <option value="marketing">MARKETING</option>
                            <option value="doctor">DOCTOR</option>
                            <option value="admin">ADMIN</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}
                          className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                          title="Gửi email đổi mật khẩu"
                        >
                          <span className="material-symbols-outlined text-[20px]">mail</span>
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                          disabled={user.uid === userProfile?.uid}
                          className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-10"
                          title="Xóa hồ sơ"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-20 text-center italic text-slate-400">Không tìm thấy người dùng phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
