import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';

interface PlatformConfig {
    maintenanceMode: boolean;
    allowRegistration: boolean;
    announcement: {
        enabled: boolean;
        message: string;
        type: 'info' | 'warning' | 'error';
    };
    trialDays: number;
}

const PlatformSettings: React.FC = () => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<PlatformConfig>({
        maintenanceMode: false,
        allowRegistration: true,
        announcement: {
            enabled: false,
            message: '',
            type: 'info'
        },
        trialDays: 14
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const docRef = doc(db, 'platform_settings', 'global');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setConfig(docSnap.data() as PlatformConfig);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'platform_settings', 'global'), {
                ...config,
                updatedAt: serverTimestamp(),
                updatedBy: userProfile?.uid
            });
            await createSystemLog('UPDATE', 'SETTING', 'Cập nhật cấu hình Global Platform', userProfile, 'high');
            alert("Đã lưu cấu hình hệ thống!");
        } catch (error: any) {
            console.error("Error saving settings:", error);
            alert("Lỗi: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }> = ({ label, checked, onChange, description }) => (
        <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
            <div>
                <p className="font-bold text-slate-700 text-sm">{label}</p>
                {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
        </div>
    );

    if (loading) return <div className="p-10 text-center text-slate-400">Đang tải cấu hình...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-black text-primary font-display tracking-tight uppercase">CẤU HÌNH HỆ THỐNG</h2>
                    <p className="text-slate-500 font-medium">Thiết lập toàn cục cho hệ thống SaaS Platform.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-6 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark shadow-lg shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {saving ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : <span className="material-symbols-outlined">save</span>}
                    Lưu Cấu Hình
                </button>
            </div>

            <div className="space-y-6">
                {/* System Status Section */}
                <section className="bg-white p-6 rounded-[2rem] shadow-card border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-500">gpp_maybe</span>
                        Trạng thái hệ thống
                    </h3>
                    <div className="space-y-3">
                        <Toggle
                            label="Chế độ bảo trì (Maintenance Mode)"
                            description="Khi bật, chỉ Super Admin mới có thể đăng nhập. Người dùng khác sẽ thấy thông báo bảo trì."
                            checked={config.maintenanceMode}
                            onChange={v => setConfig({ ...config, maintenanceMode: v })}
                        />
                        <Toggle
                            label="Cho phép đăng ký mới"
                            description="Tắt để tạm dừng việc đăng ký Tenant/User mới."
                            checked={config.allowRegistration}
                            onChange={v => setConfig({ ...config, allowRegistration: v })}
                        />
                    </div>
                </section>

                {/* Announcement Section */}
                <section className="bg-white p-6 rounded-[2rem] shadow-card border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">campaign</span>
                        Thông báo toàn hệ thống (Global Banner)
                    </h3>

                    <div className="space-y-4">
                        <Toggle
                            label="Hiển thị thông báo"
                            checked={config.announcement.enabled}
                            onChange={v => setConfig({ ...config, announcement: { ...config.announcement, enabled: v } })}
                        />

                        {config.announcement.enabled && (
                            <div className="animate-in slide-in-from-top-2 space-y-4 pt-4 border-t border-slate-50">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại thông báo</label>
                                    <div className="flex gap-4 mt-2">
                                        {['info', 'warning', 'error'].map(type => (
                                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="announceType"
                                                    checked={config.announcement.type === type}
                                                    onChange={() => setConfig({ ...config, announcement: { ...config.announcement, type: type as any } })}
                                                    className="accent-primary"
                                                />
                                                <span className={`text-sm font-bold uppercase ${type === 'info' ? 'text-blue-500' : type === 'warning' ? 'text-amber-500' : 'text-rose-500'
                                                    }`}>{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung thông báo</label>
                                    <input
                                        value={config.announcement.message}
                                        onChange={e => setConfig({ ...config, announcement: { ...config.announcement, message: e.target.value } })}
                                        className="w-full h-12 px-4 mt-1 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Nhập nội dung thông báo hiển thị cho toàn bộ user..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Other Settings */}
                <section className="bg-white p-6 rounded-[2rem] shadow-card border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">tune</span>
                        Thiết lập mặc định
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian dùng thử (Ngày)</label>
                            <input
                                type="number"
                                value={config.trialDays}
                                onChange={e => setConfig({ ...config, trialDays: Number(e.target.value) })}
                                className="w-full h-12 px-4 mt-1 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PlatformSettings;
