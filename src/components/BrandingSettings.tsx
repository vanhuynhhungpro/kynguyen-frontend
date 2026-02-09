import React, { useState, useEffect } from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const BrandingSettings: React.FC = () => {
    const { branding, updateBranding } = useBranding();
    const [loading, setLoading] = useState<string | null>(null); // loading state per section

    // Local state for all fields
    const [formData, setFormData] = useState({
        logoUrl: '',
        primaryColor: '#000000',
        primaryDarkColor: '#000000',
        accentColor: '#000000',
        accentLightColor: '#ffffff',
        companyName: '',
        fontFamily: 'inter',
        borderRadius: 'md',
        headerStyle: 'default',
        heroImageUrl: '',
        heroTitle: '',
        heroSubtitle: '',
        productsBanner: '',
        servicesBanner: '',
        newsBanner: '',
        aboutBanner: '',
    });

    useEffect(() => {
        setFormData({
            logoUrl: branding.logoUrl || '',
            primaryColor: branding.primaryColor || '#0B3C49',
            primaryDarkColor: branding.primaryDarkColor || '#082D38',
            accentColor: branding.accentColor || '#3FA796',
            accentLightColor: branding.accentLightColor || '#F0F9F8',
            companyName: branding.companyName || '',
            fontFamily: branding.fontFamily || 'inter',
            borderRadius: branding.borderRadius || 'md',
            headerStyle: branding.headerStyle || 'default' as any,
            heroImageUrl: branding.heroImageUrl || '',
            heroTitle: branding.heroTitle || '',
            heroSubtitle: branding.heroSubtitle || '',
            productsBanner: branding.productsBanner || '',
            servicesBanner: branding.servicesBanner || '',
            newsBanner: branding.newsBanner || '',
            aboutBanner: branding.aboutBanner || '',
        });
    }, [branding]);

    // Helper to upload file and update state
    const handleFileUpload = async (file: File, fieldName: string) => {
        try {
            const storageRef = ref(storage, `branding/${fieldName}-${Date.now()}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error("Upload failed", error);
            throw error;
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = await handleFileUpload(file, fieldName);
            setFormData(prev => ({ ...prev, [fieldName]: url }));
        }
    };

    const saveSection = async (sectionName: string, fieldsToSave: Partial<typeof formData>) => {
        setLoading(sectionName);
        try {
            await updateBranding(fieldsToSave as any);
            // Optional: Toast success
        } catch (error) {
            console.error("Save failed", error);
            alert("Lưu thất bại");
        } finally {
            setLoading(null);
        }
    };

    // Reusable Section Component
    const Section = ({ title, children, onSave, id }: { title: string, children: React.ReactNode, onSave: () => void, id: string }) => (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                <button
                    onClick={onSave}
                    disabled={!!loading}
                    className="text-xs font-bold text-primary hover:text-primary-dark disabled:opacity-50 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all"
                >
                    {loading === id ? 'Đang lưu...' : 'Lưu thay đổi'}
                    {!loading && <span className="material-symbols-outlined text-sm">save</span>}
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* 1. Identity */}
            <Section
                id="identity"
                title="Định danh Thương hiệu"
                onSave={() => saveSection('identity', { logoUrl: formData.logoUrl, companyName: formData.companyName })}
            >
                <div className="flex items-start gap-6">
                    <div className="shrink-0">
                        <label className="block text-xs font-bold text-slate-500 mb-2">Logo</label>
                        <div className="size-24 border border-slate-200 rounded-lg flex items-center justify-center relative overflow-hidden group bg-slate-50">
                            {formData.logoUrl ? (
                                <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full p-2 object-contain" />
                            ) : (
                                <span className="material-symbols-outlined text-slate-300 text-2xl">image</span>
                            )}
                            <input
                                type="file"
                                onChange={(e) => handleFileChange(e, 'logoUrl')}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-white text-[10px] font-bold">Thay đổi</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-2">Tên hiển thị</label>
                        <input
                            type="text"
                            value={formData.companyName}
                            onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="Nhập tên công ty..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1.5">Tên này sẽ hiển thị trên tiêu đề trang và chân trang.</p>
                    </div>
                </div>
            </Section>

            {/* 2. Colors */}
            <Section
                id="colors"
                title="Màu sắc chủ đạo"
                onSave={() => saveSection('colors', { primaryColor: formData.primaryColor, accentColor: formData.accentColor })}
            >
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Màu Chính (Primary)</label>
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg shadow-sm border border-slate-100 shrink-0" style={{ backgroundColor: formData.primaryColor }}></div>
                            <input
                                type="text"
                                value={formData.primaryColor}
                                onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                                className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono uppercase"
                            />
                            <div className="relative size-8">
                                <input type="color" value={formData.primaryColor} onChange={e => setFormData({ ...formData, primaryColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                <span className="material-symbols-outlined text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">palette</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Màu Nhấn (Accent)</label>
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg shadow-sm border border-slate-100 shrink-0" style={{ backgroundColor: formData.accentColor }}></div>
                            <input
                                type="text"
                                value={formData.accentColor}
                                onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                                className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono uppercase"
                            />
                            <div className="relative size-8">
                                <input type="color" value={formData.accentColor} onChange={e => setFormData({ ...formData, accentColor: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                <span className="material-symbols-outlined text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">palette</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 3. Typography & UI */}
            <Section
                id="ui"
                title="Giao diện & Typo"
                onSave={() => saveSection('ui', { fontFamily: formData.fontFamily, borderRadius: formData.borderRadius, headerStyle: formData.headerStyle })}
            >
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Font chữ</label>
                        <select
                            value={formData.fontFamily}
                            onChange={e => setFormData({ ...formData, fontFamily: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                        >
                            <option value="inter">Inter (Modern)</option>
                            <option value="playfair">Playfair (Classic)</option>
                            <option value="roboto">Roboto (Neutral)</option>
                            <option value="montserrat">Montserrat (Bold)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Bo góc (Radius)</label>
                        <select
                            value={formData.borderRadius}
                            onChange={e => setFormData({ ...formData, borderRadius: e.target.value })}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                        >
                            <option value="none">Vuông (Sharp)</option>
                            <option value="sm">Nhỏ (4px)</option>
                            <option value="md">Vừa (8px)</option>
                            <option value="lg">Lớn (16px)</option>
                            <option value="full">Tròn (Pill)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Header Layout</label>
                        <select
                            value={formData.headerStyle}
                            onChange={e => setFormData({ ...formData, headerStyle: e.target.value as any })}
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                        >
                            <option value="default">Logo Trái</option>
                            <option value="centered">Logo Giữa</option>
                            <option value="minimal">Tối giản</option>
                        </select>
                    </div>
                </div>
            </Section>

            {/* 4. Home Hero */}
            <Section
                id="hero"
                title="Trang chủ (Hero Section)"
                onSave={() => saveSection('hero', { heroTitle: formData.heroTitle, heroSubtitle: formData.heroSubtitle, heroImageUrl: formData.heroImageUrl })}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Ảnh Banner Chính</label>
                        <div className="h-32 border border-slate-200 rounded-lg overflow-hidden relative group bg-slate-50">
                            {formData.heroImageUrl ? (
                                <img src={formData.heroImageUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                    <span className="text-xs">Chưa có ảnh (1920x800)</span>
                                </div>
                            )}
                            <input type="file" onChange={e => handleFileChange(e, 'heroImageUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white text-xs font-bold">
                                Tải ảnh mới
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Tiêu đề chính (Headline)</label>
                            <input
                                type="text"
                                value={formData.heroTitle}
                                onChange={e => setFormData({ ...formData, heroTitle: e.target.value })}
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-bold"
                                placeholder="VD: Tìm Kiếm Ngôi Nhà Trong Mơ"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Mô tả (Subtitle)</label>
                            <textarea
                                value={formData.heroSubtitle}
                                onChange={e => setFormData({ ...formData, heroSubtitle: e.target.value })}
                                className="w-full h-20 py-2 px-3 rounded-lg border border-slate-200 text-sm resize-none"
                                placeholder="Mô tả ngắn..."
                            />
                        </div>
                    </div>
                </div>
            </Section>

            {/* 5. Sub-page Banners */}
            <Section
                id="banners"
                title="Banner Trang con (1920x400)"
                onSave={() => saveSection('banners', { productsBanner: formData.productsBanner, servicesBanner: formData.servicesBanner, newsBanner: formData.newsBanner, aboutBanner: formData.aboutBanner })}
            >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { id: 'productsBanner', label: 'Nhà Đất' },
                        { id: 'servicesBanner', label: 'Dịch Vụ' },
                        { id: 'newsBanner', label: 'Tin Tức' },
                        { id: 'aboutBanner', label: 'Giới Thiệu' },
                    ].map(item => (
                        <div key={item.id} className="relative">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{item.label}</label>
                            <div className="h-24 border border-slate-200 rounded-lg overflow-hidden relative group bg-slate-50 hover:border-primary transition-colors">
                                {(formData as any)[item.id] ? (
                                    <img src={(formData as any)[item.id]} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                        <span className="material-symbols-outlined">image</span>
                                    </div>
                                )}
                                <input type="file" onChange={e => handleFileChange(e, item.id)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white text-[10px] font-bold">
                                    Thay đổi
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

        </div>
    );
};

export default BrandingSettings;
