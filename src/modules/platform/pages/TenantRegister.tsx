import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const TenantRegister: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<{ url: string; email: string; tenantId: string } | null>(null);

    const [formData, setFormData] = useState({
        companyName: '',
        subdomain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
        contactPhone: '',
        plan: 'growth' // default plan
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.adminPassword !== formData.confirmPassword) {
            alert("❌ Mật khẩu xác nhận không khớp!");
            return;
        }

        if (formData.adminPassword.length < 6) {
            alert("❌ Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }

        setLoading(true);

        try {
            const tenantId = formData.subdomain.toLowerCase().replace(/\s+/g, '-');

            // 1. Create Firebase Auth User
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.adminEmail,
                formData.adminPassword
            );
            const userId = userCredential.user.uid;

            // Calculate trial period (14 days)
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 14);

            // 2. Create Tenant Document
            await setDoc(doc(db, 'tenants', tenantId), {
                name: formData.companyName,
                code: tenantId,
                ownerId: userId,
                contactEmail: formData.adminEmail,
                contactPhone: formData.contactPhone,
                plan: formData.plan,
                status: 'trial',
                domains: [
                    `${tenantId}.kynguyenrealai.com`,  // Production domain
                    `${tenantId}.localhost`             // Dev domain
                ],
                branding: {
                    companyName: formData.companyName,
                    primaryColor: '#4E342E',
                    accentColor: '#CCA43B'
                },
                createdAt: serverTimestamp(),
                isActive: true
            });

            // 3. Create Admin User Document
            await setDoc(doc(db, 'users', userId), {
                uid: userId,
                email: formData.adminEmail,
                fullName: formData.adminName,
                role: 'admin',
                tenantId: tenantId,
                phone: formData.contactPhone,
                company: formData.companyName,
                createdAt: serverTimestamp(),
                isActive: true
            });

            // 4. Create Subscription Record
            await setDoc(doc(db, 'subscriptions', tenantId), {
                tenantId: tenantId,
                plan: formData.plan,
                status: 'trial',
                trialEndsAt: Timestamp.fromDate(trialEndDate),
                currentPeriodStart: serverTimestamp(),
                currentPeriodEnd: Timestamp.fromDate(trialEndDate),
                referralCode: formData.referralCode || null,
                createdAt: serverTimestamp()
            });

            // Auto redirect logic
            const protocol = window.location.protocol;
            const port = window.location.port ? `:${window.location.port}` : '';
            const hostname = window.location.hostname;

            // Determine root domain (handle localhost, www, app, etc.)
            let rootDomain = hostname;
            const parts = hostname.split('.');

            if (parts.length > 2) {
                // e.g. app.domain.com -> domain.com
                // e.g. www.domain.com -> domain.com
                rootDomain = parts.slice(1).join('.');
            }
            // If parts.length === 2 (domain.com) -> keep as is
            // If parts.length === 1 (localhost) -> keep as is

            const tenantUrl = `${protocol}//${tenantId}.${rootDomain}${port}/login`;

            // Show Success Modal instead of Alert
            setSuccessData({
                url: tenantUrl,
                email: formData.adminEmail,
                tenantId: tenantId
            });

        } catch (error: any) {
            console.error("Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("❌ Email này đã được sử dụng!");
            } else {
                alert("❌ Lỗi: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-body text-slate-200 flex items-center justify-center p-6 relative">
            {/* Success Modal */}
            {successData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
                        {/* Header Decoration */}
                        <div className="h-32 bg-gradient-to-br from-indigo-600 to-purple-600 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                            <div className="size-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                                <span className="material-symbols-outlined text-4xl text-white">check_circle</span>
                            </div>
                        </div>

                        <div className="p-8 text-center">
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Đăng Ký Thành Công!</h3>
                            <p className="text-slate-500 mb-8 text-sm">Hệ thống website của bạn đã sẵn sàng hoạt động.</p>

                            <div className="space-y-4 mb-8 text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="flex items-start gap-4">
                                    <div className="size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg">language</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đường dẫn truy cập</p>
                                        <a href={successData.url} className="text-sm font-bold text-indigo-600 hover:underline break-all">{successData.url}</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tài khoản quản trị</p>
                                        <p className="text-sm font-bold text-slate-700">{successData.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="size-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg">timelapse</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gói dùng thử</p>
                                        <p className="text-sm font-bold text-slate-700">14 Ngày miễn phí (Pro Plan)</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => window.location.href = successData.url}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                Truy cập ngay
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute top-0 right-0 size-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 size-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-2xl relative z-10">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 mb-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 size-12 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                        </div>
                        <span className="text-2xl font-black text-white uppercase">KyNguyen<span className="text-indigo-400">RealAI</span></span>
                    </Link>
                    <h1 className="text-4xl font-black text-white mb-2">Tạo Website Của Bạn</h1>
                    <p className="text-slate-400">Dùng thử miễn phí 14 ngày • Không cần thẻ tín dụng</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Tên Công Ty *</label>
                            <input
                                required
                                type="text"
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none"
                                placeholder="VD: Hùng BĐS Sài Gòn"
                            />
                        </div>

                        {/* Subdomain */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Tên Miền Con *</label>
                            <div className="flex items-center gap-2">
                                <input
                                    required
                                    type="text"
                                    value={formData.subdomain}
                                    onChange={e => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    className="flex-1 h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none font-mono"
                                    placeholder="hungbds"
                                />
                                <span className="text-slate-500 font-mono text-sm">.kynguyenrealai.com</span>
                            </div>
                        </div>

                        {/* Admin Name & Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Họ Tên Admin *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.adminName}
                                    onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Email Admin *</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.adminEmail}
                                    onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Mật Khẩu *</label>
                                <input
                                    required
                                    type="password"
                                    value={formData.adminPassword}
                                    onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Xác Nhận *</label>
                                <input
                                    required
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Phone & Referral */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Điện Thoại</label>
                                <input
                                    type="tel"
                                    value={formData.contactPhone}
                                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none"
                                    placeholder="0901234567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Mã Giới Thiệu</label>
                                <input
                                    type="text"
                                    value={formData.referralCode}
                                    onChange={e => setFormData({ ...formData, referralCode: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 outline-none"
                                    placeholder="Nếu có"
                                />
                            </div>
                        </div>

                        {/* Plan Selection */}
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-3">Chọn Gói</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'basic', name: 'Basic', price: '500K' },
                                    { id: 'pro', name: 'Pro', price: '2M' },
                                    { id: 'enterprise', name: 'Enterprise', price: '5M' }
                                ].map(plan => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, plan: plan.id as any })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.plan === plan.id
                                            ? 'border-indigo-500 bg-indigo-500/10'
                                            : 'border-slate-700 bg-slate-800/30'
                                            }`}
                                    >
                                        <p className="font-black text-white text-sm">{plan.name}</p>
                                        <p className="text-xs text-slate-400">{plan.price}/tháng</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full h-14 rounded-xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-500 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? (
                                <><span className="animate-spin material-symbols-outlined">progress_activity</span> Đang Tạo...</>
                            ) : (
                                <><span className="material-symbols-outlined">rocket_launch</span> Tạo Tài Khoản</>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-6">
                        Đã có tài khoản? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold">Đăng nhập</Link>
                    </p>
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    Bằng việc đăng ký, bạn đồng ý với <Link to="/terms" className="text-slate-500 hover:text-slate-400">Điều khoản</Link> và <Link to="/privacy" className="text-slate-500 hover:text-slate-400">Chính sách bảo mật</Link>
                </p>
            </div>
        </div>
    );
};

export default TenantRegister;
