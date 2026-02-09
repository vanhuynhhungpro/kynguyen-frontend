import React from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../contexts/BrandingContext';

const LuxeFooter: React.FC = () => {
    const { branding } = useBranding();

    return (
        <footer className="bg-slate-50 border-t border-slate-100 py-16 font-body">
            <div className="max-w-4xl mx-auto px-6 text-center">

                {/* Centered Logo */}
                <div className="flex flex-col items-center gap-4 mb-10">
                    <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                        <span className="material-symbols-outlined text-2xl">diamond</span>
                    </div>
                    <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">{branding.companyName}</h2>
                </div>

                {/* Minimal Navigation */}
                <div className="flex flex-wrap justify-center gap-8 mb-10 text-sm font-medium text-slate-600 uppercase tracking-wider text-xs">
                    <Link to="/products" className="hover:text-primary transition-colors">Nhà Đất</Link>
                    <Link to="/services" className="hover:text-primary transition-colors">Dịch Vụ</Link>
                    <Link to="/news" className="hover:text-primary transition-colors">Tin Tức</Link>
                    <Link to="/about" className="hover:text-primary transition-colors">Giới Thiệu</Link>
                    <Link to="/contact" className="hover:text-primary transition-colors">Liên Hệ</Link>
                </div>

                {/* Social Icons */}
                <div className="flex justify-center gap-6 mb-12">
                    {['instagram', 'twitter', 'linkedin', 'facebook'].map(icon => (
                        <a key={icon} href="#" className="text-slate-400 hover:text-primary transition-colors">
                            <img
                                src={`https://simpleicons.org/icons/${icon === 'twitter' ? 'x' : icon}.svg`}
                                alt={icon}
                                className="size-5 opacity-40 hover:opacity-100 transition-opacity"
                                style={{ filter: 'grayscale(100%)' }}
                            />
                        </a>
                    ))}
                </div>

                {/* Copyright & Legal */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-[11px] text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-8">
                    <p>© 2026 {branding.companyName}. All rights reserved.</p>
                    <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
                    <a
                        href={`https://app.kynguyenrealai.com/register?ref=${localStorage.getItem('REF_CODE') || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                        <span className="material-symbols-outlined text-[10px] group-hover:text-accent transition-colors">bolt</span>
                        Powered by KynguyenRealAI
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default LuxeFooter;
