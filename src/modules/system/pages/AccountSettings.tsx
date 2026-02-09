import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { updatePassword, updateProfile } from 'firebase/auth';

const AccountSettings: React.FC = () => {
    const { userProfile } = useAuth();
    const { branding } = useBranding();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        phoneNumber: '',
        email: '',
        bio: ''
    });

    // Password State
    const [passData, setPassData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (userProfile) {
            setFormData({
                displayName: userProfile.displayName || '',
                phoneNumber: userProfile.phoneNumber || '',
                email: userProfile.email || '',
                bio: userProfile.bio || ''
            });
        }
    }, [userProfile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.uid) return;
        setLoading(true);
        try {
            // Update Auth Profile
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: formData.displayName
                });
            }

            // Update Firestore Profile
            await updateDoc(doc(db, 'users', userProfile.uid), {
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                bio: formData.bio
            });

            alert("Cập nhật thông tin thành công!");
        } catch (error: any) {
            console.error("Error updating profile:", error);
            alert("Lỗi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            return alert("Mật khẩu xác nhận không khớp!");
        }
        if (passData.newPassword.length < 6) {
            return alert("Mật khẩu phải có ít nhất 6 ký tự");
        }

        setLoading(true);
        try {
            if (auth.currentUser) {
                await updatePassword(auth.currentUser, passData.newPassword);
                alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
                setPassData({ newPassword: '', confirmPassword: '' });
            }
        } catch (error: any) {
            console.error("Error changing password:", error);
            alert("Lỗi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">Cài đặt tài khoản</h2>
                <p className="text-slate-500 font-medium">Quản lý thông tin cá nhân và bảo mật.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Initial Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft text-center sticky top-8">
                        <div className="size-32 rounded-full bg-slate-100 mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                            <img
                                src={branding?.logoUrl || "https://ui-avatars.com/api/?background=random&name=" + formData.displayName}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{formData.displayName}</h3>
                        <p className="text-sm text-slate-500 mb-4">{userProfile?.role}</p>
                        <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-widest">
                            {userProfile?.status || 'Active'}
                        </div>
                    </div>
                </div>

                {/* Form Area */}
                <div className="lg:col-span-2 space-y-8">

                    {/* General Info */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-6 pb-4 border-b border-slate-50">
                            <span className="material-symbols-outlined text-indigo-500">person</span>
                            Thông tin chung
                        </h4>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Họ và tên</label>
                                    <input
                                        value={formData.displayName}
                                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Số điện thoại</label>
                                    <input
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Email (Không thể sửa)</label>
                                <input
                                    disabled
                                    value={formData.email}
                                    className="w-full h-11 px-4 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-500 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Giới thiệu</label>
                                <textarea
                                    rows={3}
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                                    placeholder="Một chút về bản thân..."
                                />
                            </div>
                            <div className="pt-2 flex justify-end">
                                <button disabled={loading} className="h-11 px-6 rounded-xl bg-indigo-600 text-white font-bold text-sm tracking-wide hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                                    {loading ? <span className="material-symbols-outlined animate-spin text-lg">sync</span> : <span className="material-symbols-outlined text-lg">save</span>}
                                    Lưu Thay Đổi
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-6 pb-4 border-b border-slate-50">
                            <span className="material-symbols-outlined text-rose-500">lock</span>
                            Bảo mật
                        </h4>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        value={passData.newPassword}
                                        onChange={e => setPassData({ ...passData, newPassword: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nhập lại mật khẩu</label>
                                    <input
                                        type="password"
                                        value={passData.confirmPassword}
                                        onChange={e => setPassData({ ...passData, confirmPassword: e.target.value })}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end">
                                <button disabled={loading || !passData.newPassword} className="h-11 px-6 rounded-xl bg-slate-800 text-white font-bold text-sm tracking-wide hover:bg-slate-700 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Đổi Mật Khẩu
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
