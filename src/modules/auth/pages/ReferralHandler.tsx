import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ReferralHandler: React.FC = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (code) {
            console.log("Captured Referral Code:", code);
            localStorage.setItem('affiliate_ref', code);
            // Future: Call API to track click
        }
        // Redirect to register page
        navigate('/tenant/register');
    }, [code, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-bold">
            <span className="material-symbols-outlined animate-spin mr-2">sync</span>
            Đang xử lý mã giới thiệu...
        </div>
    );
};

export default ReferralHandler;
