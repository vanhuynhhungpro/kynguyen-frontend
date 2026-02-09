import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const PlatformLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const { logout, userProfile } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const menuItems = [
        { name: 'Dashboard', path: '/platform/dashboard', icon: 'monitoring' },
        { name: 'Quản lý Tenant', path: '/platform/tenants', icon: 'domain' },
        { name: 'Gói Dịch Vụ', path: '/platform/subscriptions', icon: 'workspace_premium' },
        { name: 'Tài chính & Doanh thu', path: '/platform/finance', icon: 'payments' },
        { name: 'Cấu hình Hệ thống', path: '/platform/settings', icon: 'settings_suggest' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-display">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight">PLATFORM <span className="text-indigo-400">ADMIN</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto hidden-scrollbar">
                    <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">Main Menu</p>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                <span className={`material-symbols-outlined ${isActive ? 'filled-icon' : ''}`}>{item.icon}</span>
                                <span className="text-sm font-bold">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="text-sm font-bold">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <h1 className="text-lg font-bold text-slate-800 truncate">
                            {menuItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                            <img
                                src={`https://ui-avatars.com/api/?name=${userProfile?.fullName || 'Admin'}&background=random`}
                                alt="Admin"
                                className="size-8 rounded-full"
                            />
                            <span className="text-sm font-bold text-slate-700 hidden sm:block">{userProfile?.fullName || 'Administrator'}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default PlatformLayout;
