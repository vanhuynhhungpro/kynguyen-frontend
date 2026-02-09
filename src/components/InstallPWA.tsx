import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstallBanner(false);
        }
        setDeferredPrompt(null);
    };

    if (!showInstallBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-[2rem] p-6 flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center gap-4">
                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">download_for_offline</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Cài đặt ứng dụng</h3>
                        <p className="text-xs text-slate-500 font-medium">Trải nghiệm mượt mà hơn trên điện thoại</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowInstallBanner(false)}
                        className="size-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="h-10 px-5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                    >
                        Cài đặt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
