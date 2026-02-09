import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';
import { useAuth } from '../contexts/AuthContext';

const LuxeNavbar: React.FC = () => {
    const { branding } = useBranding();
    const { currentUser, userProfile } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Standard Nav Links from App.tsx
    const navLinks = [
        { name: 'Trang Chủ', path: '/' },
        { name: 'Nhà Đất', path: '/products' },
        { name: 'Dịch Vụ', path: '/services' },
        { name: 'Tin Tức', path: '/news' },
        { name: 'Giới Thiệu', path: '/about' },
        { name: 'Liên Hệ', path: '/contact' },
    ];

    const isActive = (path: string) => location.pathname === path;
    const isStaff = userProfile && userProfile.role !== 'user';
    const dashboardPath = userProfile?.role === 'super_admin' ? '/platform/dashboard' : '/dashboard';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-display ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt={branding.companyName} className="h-8 w-auto object-contain" />
                    ) : (
                        <div className="size-8 bg-slate-900 rounded-full flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-sm">diamond</span>
                        </div>
                    )}
                    <span className={`text-lg font-bold tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>{branding.companyName}</span>
                </Link>

                {/* Centered Menu - Dynamic */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`transition-colors uppercase tracking-wider text-xs font-bold ${isActive(link.path) ? 'text-slate-900' : 'hover:text-slate-900'}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {currentUser ? (
                        isStaff ? (
                            <Link to={dashboardPath} className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1">
                                Dashboard <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        ) : (
                            <Link to="/settings" className="size-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                                <span className="material-symbols-outlined text-slate-600 text-sm">settings</span>
                            </Link>
                        )
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors hidden sm:block">
                                Đăng Nhập
                            </Link>
                            <Link
                                to="/register"
                                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                            >
                                Đăng Ký
                            </Link>
                        </>
                    )}
                </div>
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden size-10 flex items-center justify-center rounded-full bg-slate-100/50 hover:bg-slate-200/50 backdrop-blur-md transition-colors text-slate-900"
                >
                    <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
            </div>

            {/* Mobile Menu Drawer */}
            <div className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col pt-24 px-6 pb-8">
                    <div className="flex flex-col gap-6 text-xl font-display font-medium text-slate-900">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`py-2 border-b border-slate-100 ${isActive(link.path) ? 'text-primary font-bold' : ''}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-auto flex flex-col gap-4">
                        {currentUser ? (
                            <Link
                                to={dashboardPath}
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full h-12 flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full h-12 flex items-center justify-center rounded-xl border border-slate-200 font-bold"
                                >
                                    Đăng Nhập
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full h-12 flex items-center justify-center rounded-xl bg-slate-900 text-white font-bold"
                                >
                                    Đăng Ký
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default LuxeNavbar;
