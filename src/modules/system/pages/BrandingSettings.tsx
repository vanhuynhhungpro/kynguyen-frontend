import React, { useState, useEffect } from 'react';
import { useBranding, ThemePresets } from '../../../contexts/BrandingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { createSystemLog } from '../../../services/Logger';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { functions } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';

// Specialized Modal for Domain Recommendation
const WWWSuggestionModal: React.FC<{
    isOpen: boolean;
    domain: string;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, domain, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header (Warning Style) */}
                <div className="h-28 bg-gradient-to-br from-amber-400 to-orange-500 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="text-center z-10 p-6">
                        <div className="inline-flex items-center justify-center size-12 rounded-full bg-white/20 backdrop-blur-md mb-2 text-white border border-white/30 shadow-lg">
                            <span className="material-symbols-outlined text-3xl">domain_verification</span>
                        </div>
                        <h3 className="text-white font-black text-lg uppercase tracking-tight text-shadow-sm">Tối ưu hóa kết nối</h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6">
                        <h4 className="font-bold text-amber-800 text-sm mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">lightbulb</span>
                            Khuyến nghị quan trọng
                        </h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Hệ thống phát hiện bạn đang kết nối tên miền gốc <strong>{domain.replace('www.', '')}</strong>.
                            Để đảm bảo website hoạt động ổn định nhất trên mọi nhà mạng (tránh lỗi NXDOMAIN), chúng tôi khuyên dùng <strong>{domain}</strong>.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                            <span className="text-xs font-bold text-slate-500 uppercase">Đổi thành:</span>
                            <span className="font-mono font-bold text-indigo-600 text-lg">{domain}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="h-12 border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wide hover:bg-slate-50 transition-all"
                            >
                                Giữ nguyên (Không tốt)
                            </button>
                            <button
                                onClick={onConfirm}
                                className="h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wide hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                Đồng ý (Khuyên dùng)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BrandingSettings: React.FC = () => {
    const { branding, updateBranding, applyPreset, loading, tenantId } = useBranding();
    const { userProfile } = useAuth();

    const [localSettings, setLocalSettings] = useState(branding);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'themes' | 'identity' | 'colors' | 'ui' | 'banners' | 'domain'>('themes');

    // Domain Management State
    const [customDomain, setCustomDomain] = useState<any>(null);
    const [domainInput, setDomainInput] = useState('');
    const [domainLoading, setDomainLoading] = useState(false);

    // Popup State
    const [wwwRecommendation, setWwwRecommendation] = useState<{ isOpen: boolean, domain: string, originalDomain: string } | null>(null);

    // Resolve effective tenant ID (support localhost/fallback)
    const effectiveTenantId = tenantId || userProfile?.tenantId;

    useEffect(() => {
        if (!effectiveTenantId) return;
        const db = getFirestore();
        const unsub = onSnapshot(doc(db, 'tenants', effectiveTenantId), (doc) => {
            const data = doc.data();
            if (data?.customDomain) {
                setCustomDomain(data.customDomain);
            } else {
                setCustomDomain(null);
            }
        });
        return () => unsub();
    }, [effectiveTenantId]);

    const executeAddDomain = async (domainToUse: string) => {
        setWwwRecommendation(null); // Close modal if open

        // Fallback for testing on localhost or if useBranding fails
        const targetTenantId = tenantId || userProfile?.tenantId;

        if (!targetTenantId) {
            alert("Lỗi: Không tìm thấy Tenant ID! \nHệ thống không biết bạn đang cấu hình cho Tenant nào. \nVui lòng truy cập qua Subdomain (ví dụ: tenant1.domain.com) hoặc đảm bảo tài khoản có Tenant ID.");
            return;
        }

        setDomainLoading(true);
        try {
            const addDomainFn = httpsCallable(functions, 'addCustomDomain');
            await addDomainFn({ domain: domainToUse, tenantId: targetTenantId });
            alert(`Đã thêm tên miền ${domainToUse}! Vui lòng làm theo hướng dẫn DNS bên dưới.`);
            setDomainInput('');
        } catch (error: any) {
            console.error("Add domain error:", error);
            // Handle duplicate specifically
            if (error.message.includes('already exists')) {
                alert("Tên miền này đã tồn tại trên hệ thống. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.");
            } else {
                alert("Lỗi: " + error.message);
            }
        } finally {
            setDomainLoading(false);
        }
    };

    const handleAddDomain = async () => {
        if (!domainInput) return;

        let domainToAdd = domainInput.toLowerCase().trim();
        // Remove protocol if present
        domainToAdd = domainToAdd.replace(/^https?:\/\//, '');
        // Remove trailing slash
        if (domainToAdd.endsWith('/')) domainToAdd = domainToAdd.slice(0, -1);

        // Standardize Logic: Force WWW for Root Domains
        const parts = domainToAdd.split('.');
        const isRoot = parts.length === 2 && !['co.uk', 'com.vn', 'gov.vn'].includes(domainToAdd.split('.').slice(-2).join('.')); // Basic heuristic

        // If it looks like a root domain (e.g. camloliving.com)
        if (isRoot) {
            const wwwDomain = `www.${domainToAdd}`;
            // Open Custom Modal instead of window.confirm
            setWwwRecommendation({
                isOpen: true,
                domain: wwwDomain,
                originalDomain: domainToAdd
            });
            return;
        }

        // If not root, proceed normally
        executeAddDomain(domainToAdd);
    };

    const handleCheckStatus = async () => {
        setDomainLoading(true);
        try {
            const checkStatusFn = httpsCallable(functions, 'checkDomainStatus');
            await checkStatusFn({ tenantId: effectiveTenantId });
            alert("Đã cập nhật trạng thái!");
        } catch (error: any) {
            alert("Lỗi kiểm tra: " + error.message);
        } finally {
            setDomainLoading(false);
        }
    };

    const handleRemoveDomain = async () => {
        if (!window.confirm("Bạn có chắc muốn xóa tên miền này?")) return;
        setDomainLoading(true);
        try {
            const removeFn = httpsCallable(functions, 'removeCustomDomain');
            await removeFn({ tenantId: effectiveTenantId });
            setCustomDomain(null);
        } catch (error: any) {
            alert("Lỗi xóa: " + error.message);
        } finally {
            setDomainLoading(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            setLocalSettings(branding);
        }
    }, [branding, loading]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateBranding(localSettings);
            await createSystemLog('UPDATE', 'SYSTEM', 'Cập nhật giao diện thương hiệu (Branding)', userProfile, 'high');
            alert("Đã lưu cấu hình thương hiệu thành công!");
        } catch (error: any) {
            console.error("Error saving branding:", error);
            alert("Lỗi khi lưu: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleApplyPreset = async (key: string) => {
        if (window.confirm("Bạn có chắc muốn áp dụng giao diện này? Các cài đặt màu sắc cũ sẽ bị thay thế.")) {
            await applyPreset(key as any);
            createSystemLog('UPDATE', 'SYSTEM', `Áp dụng Theme Preset: ${key}`, userProfile, 'high');
        }
    };

    const ColorInput: React.FC<{ label: string; value: string; onChange: (val: string) => void; description?: string }> = ({ label, value, onChange, description }) => (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
                <span className="text-[10px] font-mono text-slate-400">{value}</span>
            </div>
            <div className="flex gap-3 items-center">
                <div className="relative overflow-hidden rounded-xl size-12 shadow-sm border border-slate-200">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                    />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none uppercase"
                />
            </div>
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </div>
    );

    const ImageInput: React.FC<{ label: string; value?: string; onChange: (val: string) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
        <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
            <div className="flex gap-4 items-start">
                <div className="size-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {value ? (
                        <img src={value} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100?text=Error')} />
                    ) : (
                        <span className="material-symbols-outlined text-slate-300">image</span>
                    )}
                </div>
                <div className="flex-1 space-y-2">
                    <input
                        value={value || ''}
                        onChange={e => onChange(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder={placeholder || "https://..."}
                    />
                    <p className="text-[10px] text-slate-400">Nhập URL hình ảnh (Khuyên dùng: Imgur, Cloudinary hoặc host ảnh công khai).</p>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="p-10 text-center text-slate-500">Đang tải cấu hình...</div>;

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 font-body">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            {tenantId ? `Tenant: ${tenantId}` : 'Single Tenant Mode'}
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 font-display tracking-tight uppercase">THIẾT LẬP GIAO DIỆN</h2>
                    <p className="text-slate-500 font-medium">Tùy chỉnh nhận diện thương hiệu, màu sắc và hình ảnh cho website.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-6 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    {saving ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : <span className="material-symbols-outlined">save</span>}
                    Lưu Thay Đổi
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-72 flex-shrink-0 space-y-2 sticky top-8">
                    {[
                        { id: 'themes', label: 'Kho Giao Diện', icon: 'grid_view' },
                        { id: 'identity', label: 'Nhận diện chung', icon: 'fingerprint' },
                        { id: 'colors', label: 'Màu sắc & Theme', icon: 'palette' },
                        { id: 'ui', label: 'Font & Giao diện', icon: 'style' },
                        { id: 'banners', label: 'Banner & Hình ảnh', icon: 'image' },
                        { id: 'domain', label: 'Tên miền riêng', icon: 'language' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-md border border-indigo-50'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                        >
                            <span className={`material-symbols-outlined ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400'}`}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}

                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mt-6">
                        <p className="text-xs font-medium text-indigo-800 mb-2">Xem trước thay đổi</p>
                        <p className="text-[10px] text-indigo-600/80 leading-relaxed">
                            Mọi thay đổi sẽ được áp dụng ngay lập tức cho toàn bộ hệ thống sau khi lưu. Hãy kiểm tra kỹ màu sắc để đảm bảo độ tương phản.
                        </p>
                    </div>
                </div>

                {/* Main Content Form */}
                <div className="flex-1 w-full bg-white rounded-[2.5rem] shadow-card border border-slate-100 p-8 min-h-[600px]">

                    {/* THEMES TAB */}
                    {activeTab === 'themes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Kho Giao Diện Mẫu (Theme Gallery)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.entries(ThemePresets).map(([key, preset]) => (
                                        <div key={key} className="group relative overflow-hidden rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer">
                                            <div className="h-24 w-full relative" style={{ backgroundColor: preset.colors.accentLight }}>
                                                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent"></div>
                                                <div className="absolute bottom-4 left-4 flex -space-x-2">
                                                    <div className="size-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: preset.colors.primary }}></div>
                                                    <div className="size-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: preset.colors.primaryDark }}></div>
                                                    <div className="size-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: preset.colors.accent }}></div>
                                                </div>
                                                <div className="absolute top-4 right-4 bg-white/50 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                                    {preset.font}
                                                </div>
                                            </div>
                                            <div className="p-5 flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{preset.name}</h4>
                                                    <p className="text-xs text-slate-400 mt-1">Radius: {preset.radius}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleApplyPreset(key)}
                                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-500/20"
                                                >
                                                    Áp dụng
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INFO TAB */}
                    {activeTab === 'identity' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Thông tin thương hiệu</h3>
                                <div className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tên Doanh Nghiệp (Hiển thị trên Tab Browser)</label>
                                        <input
                                            value={localSettings.companyName}
                                            onChange={e => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            placeholder="VD: Bất động sản Sài Gòn"
                                        />
                                    </div>
                                    <ImageInput
                                        label="Logo Website (Header)"
                                        value={localSettings.logoUrl}
                                        onChange={v => setLocalSettings({ ...localSettings, logoUrl: v })}
                                        placeholder="https://example.com/logo.png"
                                    />
                                    <ImageInput
                                        label="Favicon (Icon trên tab)"
                                        value={localSettings.faviconUrl}
                                        onChange={v => setLocalSettings({ ...localSettings, faviconUrl: v })}
                                        placeholder="https://example.com/favicon.png"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COLORS TAB */}
                    {activeTab === 'colors' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Bảng màu chủ đạo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ColorInput
                                        label="Màu chính (Primary)"
                                        value={localSettings.primaryColor}
                                        onChange={v => setLocalSettings({ ...localSettings, primaryColor: v })}
                                        description="Dùng cho Header, Button chính, Link nổi bật."
                                    />
                                    <ColorInput
                                        label="Màu chính đậm (Primary Dark)"
                                        value={localSettings.primaryDarkColor}
                                        onChange={v => setLocalSettings({ ...localSettings, primaryDarkColor: v })}
                                        description="Dùng cho trạng thái Hover hoặc nền tối."
                                    />
                                    <ColorInput
                                        label="Màu điểm nhấn (Accent)"
                                        value={localSettings.accentColor}
                                        onChange={v => setLocalSettings({ ...localSettings, accentColor: v })}
                                        description="Dùng cho các icon, badge, hoặc chi tiết trang trí."
                                    />
                                    <ColorInput
                                        label="Màu nền phụ (Accent Light)"
                                        value={localSettings.accentLightColor}
                                        onChange={v => setLocalSettings({ ...localSettings, accentLightColor: v })}
                                        description="Dùng cho nền Section nhẹ nhàng."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UI TAB */}
                    {activeTab === 'ui' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Cấu trúc giao diện</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Font chữ chủ đạo</label>
                                        <select
                                            value={localSettings.fontFamily}
                                            onChange={e => setLocalSettings({ ...localSettings, fontFamily: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        >
                                            <option value="inter">Inter (Hiện đại, Sạch sẽ)</option>
                                            <option value="playfair">Playfair Display (Sang trọng, Cổ điển)</option>
                                            <option value="roboto">Roboto (Tiêu chuẩn)</option>
                                            <option value="montserrat">Montserrat (Mạnh mẽ, Hình khối)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Độ bo góc (Border Radius)</label>
                                        <select
                                            value={localSettings.borderRadius}
                                            onChange={e => setLocalSettings({ ...localSettings, borderRadius: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        >
                                            <option value="none">Vuông vức (Square)</option>
                                            <option value="sm">Bo nhẹ (Small)</option>
                                            <option value="md">Tiêu chuẩn (Medium)</option>
                                            <option value="lg">Bo tròn (Large)</option>
                                            <option value="full">Tròn hoàn toàn (Pill)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kiểu Header</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['default', 'centered', 'minimal'].map(style => (
                                                <button
                                                    key={style}
                                                    onClick={() => setLocalSettings({ ...localSettings, headerStyle: style as any })}
                                                    className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${localSettings.headerStyle === style
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined">{style === 'default' ? 'dock_to_left' : style === 'centered' ? 'align_center' : 'menu'}</span>
                                                    <span className="text-[10px] font-bold uppercase">{style}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mẫu giao diện Trang Chủ (Template)</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { id: 'luxe', name: 'Luxe Estates (Mới)', icon: 'diamond', desc: 'Giao diện hiện đại, tối giản, hình ảnh lớn (Khuyên dùng).' },
                                                { id: 'classic', name: 'Cổ điển (Classic)', icon: 'view_quilt', desc: 'Giao diện truyền thống với thanh tìm kiếm lớn.' }
                                            ].map(tpl => (
                                                <button
                                                    key={tpl.id}
                                                    onClick={async () => {
                                                        // Note: We map 'luxe' to the new ID. If they want classic, we use 'classic'.
                                                        // If they are currently 'default', we consider that 'luxe' in the UI.
                                                        const newSettings = { ...branding, homeTemplateId: tpl.id as any };
                                                        setLocalSettings(newSettings);
                                                        try {
                                                            await updateBranding(newSettings);
                                                        } catch (error) {
                                                            console.error("Failed to auto-save template:", error);
                                                            setLocalSettings(branding);
                                                            alert("Lỗi khi lưu giao diện. Vui lòng thử lại.");
                                                        }
                                                    }}
                                                    className={`p-4 rounded-xl border-2 flex items-center gap-4 text-left transition-all ${branding.homeTemplateId === tpl.id || (branding.homeTemplateId === 'default' && tpl.id === 'luxe')
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className={`size-12 rounded-full flex items-center justify-center border ${branding.homeTemplateId === tpl.id || (branding.homeTemplateId === 'default' && tpl.id === 'luxe') ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                        <span className="material-symbols-outlined">{tpl.icon}</span>
                                                    </div>
                                                    <div>
                                                        <span className={`block text-sm font-bold uppercase ${branding.homeTemplateId === tpl.id || (branding.homeTemplateId === 'default' && tpl.id === 'luxe') ? 'text-indigo-800' : 'text-slate-600'}`}>{tpl.name}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium">{tpl.desc}</span>
                                                    </div>
                                                    {(branding.homeTemplateId === tpl.id || (branding.homeTemplateId === 'default' && tpl.id === 'luxe')) && (
                                                        <span className="ml-auto material-symbols-outlined text-indigo-600 text-xl animate-in zoom-in spin-in-90">check_circle</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BANNERS TAB */}
                    {activeTab === 'banners' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Hình ảnh & Banner</h3>
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                        <h4 className="font-bold text-slate-700 text-sm">Trang chủ (Hero Section)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tiêu đề lớn</label>
                                                <input
                                                    value={localSettings.heroTitle}
                                                    onChange={e => setLocalSettings({ ...localSettings, heroTitle: e.target.value })}
                                                    placeholder="Nghệ thuật sống thượng lưu."
                                                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm placeholder:text-slate-400"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mô tả ngắn</label>
                                                <input
                                                    value={localSettings.heroSubtitle}
                                                    onChange={e => setLocalSettings({ ...localSettings, heroSubtitle: e.target.value })}
                                                    placeholder="Khám phá bộ sưu tập bất động sản tinh hoa dành riêng cho bạn."
                                                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm placeholder:text-slate-400"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <ImageInput label="Hình nền Hero" value={localSettings.heroImageUrl} onChange={v => setLocalSettings({ ...localSettings, heroImageUrl: v })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-700 text-sm">Banner các trang con</h4>
                                        <ImageInput label="Banner trang Dự án (Products)" value={localSettings.productsBanner} onChange={v => setLocalSettings({ ...localSettings, productsBanner: v })} />
                                        <ImageInput label="Banner trang Dịch vụ (Services)" value={localSettings.servicesBanner} onChange={v => setLocalSettings({ ...localSettings, servicesBanner: v })} />
                                        <ImageInput label="Hình nền đăng nhập (Login Screen)" value={localSettings.loginBannerUrl} onChange={v => setLocalSettings({ ...localSettings, loginBannerUrl: v })} placeholder="https://..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DOMAIN TAB */}
                    {activeTab === 'domain' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Tên miền riêng (Custom Domain)</h3>

                                {!customDomain ? (
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-4">
                                        <div className="size-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                                            <span className="material-symbols-outlined text-3xl">language</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800">Kết nối thương hiệu của bạn</h4>
                                        <p className="text-sm text-slate-500 max-w-md">
                                            Sử dụng tên miền riêng (ví dụ: <code>batdongsancuaanh.com</code>) để tăng độ uy tín và chuyên nghiệp.
                                            Hệ thống sẽ tự động cấp chứng chỉ bảo mật SSL.
                                        </p>
                                        <div className="flex gap-2 w-full max-w-sm mt-4">
                                            <input
                                                value={domainInput}
                                                onChange={(e) => setDomainInput(e.target.value)}
                                                placeholder="Nhập tên miền (VD: realai.vn)..."
                                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-700"
                                            />
                                            <button
                                                onClick={handleAddDomain}
                                                disabled={domainLoading || !domainInput}
                                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                {domainLoading ? '...' : 'Kết nối'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <DomainDetails customDomain={customDomain} tenantId={effectiveTenantId} handleCheckStatus={handleCheckStatus} handleRemoveDomain={handleRemoveDomain} domainLoading={domainLoading} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recommendation Modal */}
            {wwwRecommendation && (
                <WWWSuggestionModal
                    isOpen={wwwRecommendation.isOpen}
                    domain={wwwRecommendation.domain}
                    onClose={() => executeAddDomain(wwwRecommendation.originalDomain)} // Keep original if they cancel/reject
                    onConfirm={() => executeAddDomain(wwwRecommendation.domain)}    // Use WWW if they confirm
                />
            )}
        </div>
    );
};

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = status === 'active'
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
        : 'bg-amber-100 text-amber-700 border-amber-200';
    const icon = status === 'active' ? 'check_circle' : 'pending';
    const label = status === 'active' ? 'Đang hoạt động' : 'Đang xác minh';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles}`}>
            <span className="material-symbols-outlined text-sm">{icon}</span>
            {label}
        </span>
    );
};

interface RecordRowProps {
    type: string;
    host: string;
    value: string;
    active?: boolean;
}

const RecordRow: React.FC<RecordRowProps> = ({ type, host, value, active = false }) => (
    <tr className="group hover:bg-indigo-50/30 transition-colors">
        <td className="px-4 py-3 w-24">
            <span className="font-mono font-bold text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">{type}</span>
        </td>
        <td className="px-4 py-3 w-1/4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => copyToClipboard(host)} title="Click to copy">
                <span className="font-mono text-xs font-bold text-slate-700">{host}</span>
                <span className="material-symbols-outlined text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">content_copy</span>
            </div>
        </td>
        <td className="px-4 py-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => copyToClipboard(value)} title="Click to copy">
                <span className={`font-mono text-xs break-all ${active ? 'text-emerald-600 font-bold' : 'text-indigo-600'}`}>{value}</span>
                <span className="material-symbols-outlined text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">content_copy</span>
            </div>
        </td>
        <td className="px-4 py-3 w-10 text-right">
            {active && <span className="material-symbols-outlined text-emerald-500 text-lg">check</span>}
        </td>
    </tr>
);

const DomainDetails: React.FC<{ customDomain: any, tenantId?: string, handleCheckStatus: any, handleRemoveDomain: any, domainLoading: boolean }> = ({ customDomain, tenantId, handleCheckStatus, handleRemoveDomain, domainLoading }) => {

    // Detect if this is a 'www' subdomain (Standard Mode)
    const isWWW = customDomain.domain.toLowerCase().startsWith('www.');
    const rootDomain = isWWW ? customDomain.domain.substring(4) : customDomain.domain;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                        <span className="material-symbols-outlined text-2xl">language</span>
                    </div>
                    <div>
                        <h4 className="font-black text-xl text-slate-800 tracking-tight">{customDomain.domain}</h4>
                        <div className="flex items-center gap-3 mt-1">
                            <StatusBadge status={customDomain.hostnameStatus} />
                            <span className="text-[10px] font-mono text-slate-400">ID: {customDomain.cloudflareId}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCheckStatus} disabled={domainLoading} className="h-9 px-4 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm flex items-center gap-2 transition-all">
                        {domainLoading ? <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">refresh</span>}
                        Kiểm tra
                    </button>
                    <button onClick={handleRemoveDomain} disabled={domainLoading} className="h-9 px-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 hover:border-rose-200 flex items-center gap-2 transition-all">
                        <span className="material-symbols-outlined text-sm">link_off</span>
                        Hủy
                    </button>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {/* Step 1: Connection */}
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="flex items-center justify-center size-6 rounded-full bg-indigo-600 text-white text-xs font-bold">1</span>
                        <h5 className="font-bold text-indigo-900 text-sm uppercase tracking-wide">Kết nối chính thức (CNAME)</h5>
                    </div>

                    <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-indigo-50 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-100">
                                <tr>
                                    <th className="px-4 py-3">Loại</th>
                                    <th className="px-4 py-3">Host (Name)</th>
                                    <th className="px-4 py-3">Value (Content)</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-50 bg-white">
                                <RecordRow
                                    type="CNAME"
                                    host={isWWW ? 'www' : '@'}
                                    value={`${tenantId || 'app'}.kynguyenrealai.com`}
                                    active={customDomain.hostnameStatus === 'active'}
                                />
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Bản ghi quan trọng nhất để website hoạt động.
                    </p>
                </div>
                {/* Step 1.5: Firebase Ownership Verification (If required) */}
                {customDomain.firebaseVerification && (
                    <div className="p-6 bg-amber-50/50 border-t border-amber-100">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="flex items-center justify-center size-6 rounded-full bg-amber-500 text-white text-xs font-bold">!</span>
                            <h5 className="font-bold text-amber-900 text-sm uppercase tracking-wide">Xác minh sở hữu (Bắt buộc)</h5>
                        </div>

                        <div className="border border-amber-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-amber-100/50 text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-200">
                                    <tr>
                                        <th className="px-4 py-3">Loại</th>
                                        <th className="px-4 py-3">Host (Name)</th>
                                        <th className="px-4 py-3">Value (Content)</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 bg-white">
                                    <RecordRow
                                        type="TXT"
                                        host={customDomain.firebaseVerification.name || '@'}
                                        value={customDomain.firebaseVerification.value}
                                        active={false}
                                    />
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-[11px] text-amber-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            Google yêu cầu bản ghi này để chứng minh bạn là chủ sở hữu tên miền.
                        </p>
                    </div>
                )}

                {/* Step 2: Verification (Dynamic) */}
                {(customDomain.sslValidationRecords && customDomain.sslValidationRecords.length > 0) && (
                    <div className="p-6 bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="flex items-center justify-center size-6 rounded-full bg-slate-900 text-white text-xs font-bold">2</span>
                            <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Xác minh tên miền & SSL</h5>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Loại</th>
                                        <th className="px-4 py-3">Host (Name)</th>
                                        <th className="px-4 py-3">Value (Content)</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {/* SSL Validation Records */}
                                    {customDomain.sslValidationRecords?.map((record: any, idx: number) => (
                                        <RecordRow
                                            key={`ssl-${idx}`}
                                            type="TXT"
                                            host={record.txt_name.replace(`.${rootDomain}`, '')}
                                            value={record.txt_value}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">info</span>
                            Thêm bản ghi TXT này để xác minh bảo mật SSL.
                        </p>
                    </div>
                )}

                {/* Step 3: Redirect */}
                {isWWW && (
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="flex items-center justify-center size-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">3</span>
                            <h5 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Chuyển hướng (Optional)</h5>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
                            <span className="material-symbols-outlined text-amber-500 mt-0.5">alt_route</span>
                            <div>
                                <p className="text-xs font-bold text-amber-800 mb-1">Cấu hình Redirect cho tên miền gốc</p>
                                <p className="text-[11px] text-amber-700 leading-relaxed max-w-lg mb-2">
                                    Để khách truy cập <b>{rootDomain}</b> tự động chuyển sang <b>{customDomain.domain}</b>.
                                    Cấu hình bản ghi <b>Redirect / URL Record</b> tại nhà cung cấp DNS:
                                </p>
                                <div className="inline-flex flex-wrap gap-4 bg-white/50 px-3 py-2 rounded-lg border border-amber-200/50 text-xs font-mono text-amber-900">
                                    <span>Type: <b>Redirect Record</b></span>
                                    <span>Host: <b>@</b></span>
                                    <span>Value: <b>http://{customDomain.domain}</b></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrandingSettings;
