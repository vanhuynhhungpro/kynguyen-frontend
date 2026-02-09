import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useBranding } from '../../../contexts/BrandingContext';
import { useSubscription } from '../../../contexts/SubscriptionContext';
import { FeatureKey } from '../../../types/subscription';

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();

    const { hasFeature, setShowUpgradeModal } = useSubscription();
    const { branding } = useBranding();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const role = userProfile?.role || 'user';
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin' || isSuperAdmin;
    const isDoctor = role === 'doctor' || isAdmin;
    const isMarketing = role === 'marketing' || isAdmin;
    const isStaff = role !== 'user';

    const sections = [
        {
            title: 'DANH MỤC CHÍNH',
            items: [
                { name: 'Bảng điều khiển', icon: 'grid_view', path: '/dashboard', show: isStaff },
                { name: 'Quản lý BĐS', icon: 'apartment', path: '/manage-properties', show: isStaff },
                { name: 'Thị trường & Xu hướng', icon: 'trending_up', path: '/market-trends', show: isStaff, feature: 'market_trends' },
            ]
        },
        {
            title: 'ĐƠN HÀNG - KHÁCH HÀNG',
            items: [
                { name: 'Quản lý Booking/Cọc', icon: 'receipt_long', path: '/manage-orders', show: isMarketing },
                { name: 'Quản lý khách hàng', icon: 'group', path: '/manage-customers', show: isMarketing },

                { name: 'Yêu cầu tư vấn', icon: 'support_agent', path: '/consultations', show: isMarketing },
                { name: 'Tài chính & Lợi nhuận', icon: 'analytics', path: '/financial-analytics', show: isAdmin || isMarketing, feature: 'financial_analytics' },
            ]
        },
        {
            title: 'QUẢN TRỊ NỘI DUNG',
            items: [
                { name: 'Quản lý tin tức', icon: 'article', path: '/manage-news', show: isMarketing },
                { name: 'Marketing & ROI', icon: 'campaign', path: '/marketing-analytics', show: isMarketing, feature: 'marketing_analytics' },
                { name: 'Chuyên mục tin', icon: 'category', path: '/manage-categories', show: isMarketing },
                { name: 'Hashtag bài viết', icon: 'tag', path: '/manage-tags', show: isMarketing },
                { name: 'AI Social Agent', icon: 'smart_toy', path: '/social-agent', show: isMarketing, feature: 'social_agent' },
                { name: 'Gói Dịch vụ & Giá', icon: 'price_change', path: '/manage-services', show: isMarketing },
                { name: 'Trang Giới thiệu', icon: 'person_book', path: '/manage-about', show: isMarketing },
                { name: 'AI Writer', icon: 'auto_awesome', path: '/edit-news', show: isMarketing, feature: 'ai_writer' },
            ]
        },
        {
            title: 'HỆ THỐNG',
            items: [
                { name: 'Người dùng & Quyền', icon: 'manage_accounts', path: '/manage-users', show: isAdmin },
                { name: 'Nhật ký hệ thống', icon: 'clinical_notes', path: '/system-logs', show: isAdmin },
                { name: 'Thông tin liên hệ', icon: 'contact_support', path: '/manage-contact', show: isMarketing },
                { name: 'Cài đặt cá nhân', icon: 'settings', path: '/settings', show: true },
                { name: 'Gói cước & Đối tác', icon: 'workspace_premium', path: '/my-subscription', show: isAdmin },
            ]
        },
        {
            title: 'PLATFORM',
            items: [
                { name: 'Quản lý Tenant', icon: 'domain', path: '/platform/tenants', show: isSuperAdmin },
                { name: 'Platform Dashboard', icon: 'monitoring', path: '/platform/dashboard', show: isSuperAdmin },
            ]
        }
    ];

    return (
        <>
            {/* Overlay for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                ></div>
            )}

            <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 flex flex-col h-full shrink-0 z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {branding.logoUrl ? (
                            <img src={branding.logoUrl} alt="Logo" className="h-9 w-auto object-contain" />
                        ) : (
                            <div className="bg-primary size-9 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-xl filled-icon">apartment</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-lg tracking-tight text-primary uppercase leading-none truncate max-w-[140px]">{branding.companyName || 'Duong Thanh Kien'}</span>
                            <span className="text-[10px] font-black text-accent tracking-[0.2em]">ADMIN SYSTEM</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden size-10 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar">
                    {sections.map((section, sIdx) => {
                        const visibleItems = section.items.filter(item => item.show);
                        if (visibleItems.length === 0) return null;
                        return (
                            <div key={sIdx} className="space-y-2">
                                <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.title}</p>
                                <div className="space-y-1">
                                    {visibleItems.map((item, idx) => {
                                        const isActive = location.pathname === item.path;
                                        const isLocked = item.feature && !hasFeature(item.feature as FeatureKey) && !isSuperAdmin;

                                        return (
                                            <Link
                                                key={idx}
                                                to={isLocked ? '#' : item.path}
                                                onClick={(e) => {
                                                    if (isLocked) {
                                                        e.preventDefault();
                                                        setShowUpgradeModal(true);
                                                        return;
                                                    }
                                                    if (window.innerWidth < 1024) onClose();
                                                }}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                                                    ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                                    : isLocked
                                                        ? 'text-slate-400 opacity-60 hover:bg-slate-50 cursor-not-allowed'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                                                    }`}
                                            >
                                                <span className={`material-symbols-outlined text-[22px] ${isActive ? 'filled-icon' : 'opacity-70 group-hover:opacity-100'}`}>
                                                    {item.icon}
                                                </span>
                                                <span className="text-sm font-bold flex-1">{item.name}</span>
                                                {isLocked && <span className="material-symbols-outlined text-xs text-slate-400">lock</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-3 bg-white">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all group">
                        <span className="material-symbols-outlined text-[22px] opacity-70 group-hover:opacity-100">logout</span>
                        <span className="text-sm font-bold">Đăng xuất</span>
                    </button>
                    <Link to="/account-settings" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer">
                        <img src={`https://i.pravatar.cc/150?u=${userProfile?.uid}`} alt="Avatar" className="size-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-bold text-primary truncate">{userProfile?.fullName || 'Khách hàng'}</p>
                            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{role}</p>
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userProfile } = useAuth();
    const { branding } = useBranding();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50/50 overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-16 lg:h-20 shrink-0 bg-white border-b border-slate-100 px-4 lg:px-8 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden size-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div className="lg:hidden flex items-center gap-2">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
                            ) : (
                                <div className="bg-primary size-7 rounded-lg flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-sm filled-icon">apartment</span>
                                </div>
                            )}
                            <span className="font-display font-black text-xs text-primary uppercase">{branding.companyName || 'Duong Thanh Kien'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <button className="relative size-9 lg:size-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                            <span className="material-symbols-outlined text-xl lg:text-2xl">notifications</span>
                            <span className="absolute top-2 right-2 lg:top-2.5 lg:right-2.5 size-2 bg-accent rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto scroll-smooth pb-20 lg:pb-0">
                    {children}
                </div>

                {/* Bottom Navigation for Mobile */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-40 pb-safe">
                    <Link to="/dashboard" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-primary active:text-primary">
                        <span className="material-symbols-outlined text-2xl">grid_view</span>
                        <span className="text-[10px] font-bold">Dashboard</span>
                    </Link>
                    <Link to="/manage-properties" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-primary active:text-primary">
                        <span className="material-symbols-outlined text-2xl">apartment</span>
                        <span className="text-[10px] font-bold">Nhà đất</span>
                    </Link>
                    <Link to="/manage-customers" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-primary active:text-primary">
                        <span className="material-symbols-outlined text-2xl">group</span>
                        <span className="text-[10px] font-bold">Khách</span>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-primary active:text-primary">
                        <span className="material-symbols-outlined text-2xl">menu</span>
                        <span className="text-[10px] font-bold">Menu</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
