import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import BrandingSettings from './BrandingSettings';

const Settings: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { branding, applyPreset, loading: brandingLoading } = useBranding();
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'themes'>('profile');
  const [loading, setLoading] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState({
    fullName: userProfile?.fullName || '',
    phone: userProfile?.phone || '',
    bio: userProfile?.bio || ''
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), profileData);
      alert("Cập nhật thông tin cá nhân thành công!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Lỗi khi cập nhật hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-primary font-display uppercase tracking-tight">Cài đặt hệ thống</h1>
        <div className="flex gap-2">
          {[
            { id: 'profile', label: 'Hồ sơ', icon: 'person' },
            { id: 'themes', label: 'Giao diện', icon: 'palette' },
            ...(isAdmin ? [{ id: 'system', label: 'Thương hiệu', icon: 'settings' }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Selection Tab */}
      {activeTab === 'themes' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500">style</span>
              Kho Giao Diện Mẫu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Future City */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/10" onClick={() => applyPreset('future_city')}>
                <div className="h-32 bg-slate-900 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-slate-800"></div>
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-white font-bold text-lg">Future City</h3>
                    <p className="text-indigo-300 text-xs">Công nghệ & Hiện đại</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] uppercase font-black px-2 py-1 rounded">Sáng tạo</div>
                </div>
                <div className="p-4 bg-white space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded bg-slate-100"></div>
                    <div className="w-1/3 h-8 rounded bg-indigo-500"></div>
                  </div>
                  <div className="h-24 rounded bg-slate-50 border border-slate-100 p-2 space-y-2">
                    <div className="w-1/2 h-2 rounded bg-slate-200"></div>
                    <div className="w-full h-2 rounded bg-slate-100"></div>
                  </div>
                  <button className="w-full py-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs uppercase hover:bg-indigo-600 hover:text-white transition-colors">
                    Áp dụng
                  </button>
                </div>
              </div>

              {/* Royal Prestige */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200 hover:border-amber-500 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-amber-500/10" onClick={() => applyPreset('royal_prestige')}>
                <div className="h-32 bg-neutral-900 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-stone-800"></div>
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-amber-500 font-serif font-bold text-lg">Royal Prestige</h3>
                    <p className="text-stone-400 text-xs">Sang trọng & Đẳng cấp</p>
                  </div>
                  <div className="absolute top-4 right-4 border border-amber-500/50 text-amber-500 text-[10px] uppercase font-black px-2 py-1 rounded-none">Luxury</div>
                </div>
                <div className="p-4 bg-white space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-none bg-stone-50"></div>
                    <div className="w-1/3 h-8 rounded-none bg-amber-600"></div>
                  </div>
                  <div className="h-24 rounded-none bg-stone-50 border border-stone-100 p-2 space-y-2">
                    <div className="w-1/2 h-2 rounded-none bg-stone-300"></div>
                    <div className="w-full h-2 rounded-none bg-stone-200"></div>
                  </div>
                  <button className="w-full py-2 rounded-none bg-stone-100 text-stone-600 font-bold text-xs uppercase hover:bg-amber-600 hover:text-white transition-colors">
                    Áp dụng
                  </button>
                </div>
              </div>

              {/* Zen Retreat */}
              <div className="group relative rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-600 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-emerald-600/10" onClick={() => applyPreset('zen_retreat')}>
                <div className="h-32 bg-emerald-900 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 to-green-800"></div>
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-emerald-100 font-bold text-lg">Zen Retreat</h3>
                    <p className="text-emerald-300 text-xs">Bình yên & Thiên nhiên</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-100 text-[10px] uppercase font-black px-2 py-1 rounded-full">Eco</div>
                </div>
                <div className="p-4 bg-[#F5F5F4] space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-2xl bg-white shadow-sm"></div>
                    <div className="w-1/3 h-8 rounded-2xl bg-emerald-700"></div>
                  </div>
                  <div className="h-24 rounded-2xl bg-white border border-stone-200 p-2 space-y-2">
                    <div className="w-1/2 h-2 rounded-full bg-emerald-100"></div>
                    <div className="w-full h-2 rounded-full bg-stone-100"></div>
                  </div>
                  <button className="w-full py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs uppercase hover:bg-emerald-700 hover:text-white transition-colors">
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Card: Avatar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-card flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-6">
                <img
                  src={`https://i.pravatar.cc/150?u=${currentUser?.uid}`}
                  alt="Avatar"
                  className="size-32 rounded-full object-cover border-4 border-white shadow-xl group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white">camera_alt</span>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">{profileData.fullName || 'Người dùng'}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{userProfile?.role}</p>

              <div className="w-full mt-8 pt-8 border-t border-slate-50 flex justify-between text-left">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email đăng nhập</p>
                  <p className="text-xs font-bold text-slate-700 mt-1 truncate max-w-[150px]">{userProfile?.email}</p>
                </div>
                <span className="material-symbols-outlined text-emerald-500 text-lg">verified_user</span>
              </div>
            </div>
          </div>

          {/* Right Card: Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-card">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Thông tin cơ bản</h4>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Họ và tên</label>
                    <div className="relative">
                      <input
                        value={profileData.fullName}
                        onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-700 transition-all text-sm"
                        placeholder="Nhập tên của bạn"
                      />
                      <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">badge</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <div className="relative">
                      <input
                        value={profileData.phone}
                        onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-700 transition-all text-sm"
                        placeholder="09xx..."
                      />
                      <span className="material-symbols-outlined absolute left-4 top-3 text-slate-400">call</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Giới thiệu ngắn (Bio)</label>
                  <textarea
                    value={profileData.bio}
                    onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-600 transition-all text-sm resize-none"
                    placeholder="Mô tả ngắn về bạn hoặc công ty..."
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    disabled={loading}
                    type="submit"
                    className="h-12 px-8 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 transform active:scale-95"
                  >
                    {loading ? <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span> : <span className="material-symbols-outlined text-lg">save</span>}
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="-mt-8 -mx-8 sm:mx-0">
          <BrandingSettings />
        </div>
      )}
    </div>
  );
};

export default Settings;