
import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`fixed top-24 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-right-10 fade-in duration-300 ${type === 'success'
                ? 'bg-white/90 border-emerald-100 text-emerald-800'
                : 'bg-white/90 border-rose-100 text-rose-800'
            }`}>
            <div className={`shrink-0 size-8 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                <span className="material-symbols-outlined text-lg">
                    {type === 'success' ? 'check_circle' : 'error'}
                </span>
            </div>
            <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-0.5">
                    {type === 'success' ? 'Thành công' : 'Có lỗi'}
                </h4>
                <p className="text-sm font-medium opacity-90">{message}</p>
            </div>
            <button
                onClick={onClose}
                className={`ml-4 p-1 rounded-full hover:bg-black/5 transition-colors ${type === 'success' ? 'text-emerald-500' : 'text-rose-500'
                    }`}
            >
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    );
};

export default Toast;
