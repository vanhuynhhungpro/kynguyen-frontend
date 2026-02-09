
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { BRAND_HERO_IMAGE } from '../../../services/ImageAssets';
import { useBranding } from '../../../contexts/BrandingContext';

const Login: React.FC = () => {
  const { branding } = useBranding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    const savedTimestamp = localStorage.getItem('rememberTimestamp');

    if (savedTimestamp) {
      const now = new Date().getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (now - parseInt(savedTimestamp) > sevenDays) {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberTimestamp');
        return;
      }
    }

    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);

      // Save "Remember Me"
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberTimestamp', new Date().getTime().toString());
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberTimestamp');
      }

      // Check role to redirect (Note: login() updates auth state, but we might need to fetch profile or rely on AuthContext)
      // Since login() is async void, we rely on the auth state change or fetch logic in AuthContext.
      // However, retrieving the profile immediately here might be racing.
      // Better approach: Redirect to a protected route wrapper or just /dashboard which handles redirect?
      // Actually, if we send a 'user' to /dashboard, ProtectedRoute sends them to / (Home).
      // So effectively they arrive at Home. But it might look like a glitch.
      // Let's force a reload or check using a helper if possible, but simplest is:
      navigate('/dashboard'); // ProtectedRoute will handle the kickback to / if not admin.
      // But user complained about "End User View".
      // Let's trust ProtectedRoute for now, but maybe add a comment.

    } catch (err: any) {
      console.error("Login Error:", err.code);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Tài khoản đã bị tạm khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau.');
      } else {
        setError('Đăng nhập thất bại. Đã có lỗi xảy ra trong quá trình xác thực.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 relative overflow-hidden font-body">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />

      {/* Floating Back Button */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-3 px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full shadow-sm text-slate-600 hover:text-primary hover:bg-white hover:shadow-lg transition-all group"
      >
        <div className="size-8 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider">Trang chủ</span>
      </Link>

      <div className="w-full flex flex-col lg:flex-row h-screen">
        {/* Left Side: Hero Image & Brand */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden text-white p-16 flex-col justify-between">
          <div className="absolute inset-0 z-0">
            <img
              alt="Luxury Real Estate"
              src={branding?.loginBannerUrl || BRAND_HERO_IMAGE}
              className="w-full h-full object-cover opacity-60 scale-105 animate-in zoom-in-[1.05] duration-[20s]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-transparent" />
          </div>

          <div className="relative z-10 animate-in slide-in-from-left-8 duration-700 fade-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-2xl text-accent">apartment</span>
              </div>
              <div>
                <h3 className="font-display font-black text-xl tracking-tight">KynguyenRealAI</h3>
                <p className="text-[10px] text-white/60 tracking-[0.2em] uppercase">Enterprise Platform</p>
              </div>
            </div>

            <h1 className="text-5xl font-display font-bold leading-tight mb-6">
              Quản lý Bất động sản <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-light">Chuyên nghiệp & Hiệu quả</span>
            </h1>
            <p className="text-lg text-slate-300 font-light max-w-md leading-relaxed">
              Hệ thống toàn diện giúp tối ưu quy trình bán hàng, quản lý kho hàng và chăm sóc khách hàng tự động.
            </p>
          </div>

          <div className="relative z-10 flex gap-4 animate-in slide-in-from-bottom-8 duration-1000 fade-in delay-200">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <span className="material-symbols-outlined text-xl">trending_up</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Tăng trưởng</p>
                <p className="font-mono text-lg font-bold text-white">+127%</p>
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <span className="material-symbols-outlined text-xl">verified</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Tin cậy</p>
                <p className="font-mono text-lg font-bold text-white">99.9%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between bg-white h-full relative overflow-y-auto">
          {/* Spacer for top alignment if needed, or just let centering handle it */}
          <div className="flex-1 flex flex-col justify-center items-center p-8">
            <div className="w-full max-w-[420px] space-y-8 animate-in slide-in-from-right-8 duration-500 fade-in">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">Chào mừng trở lại! 👋</h2>
                <p className="text-slate-500 text-sm">Nhập thông tin đăng nhập để truy cập hệ thống quản trị.</p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-start gap-3 animate-in fade-in zoom-in-95">
                  <span className="material-symbols-outlined text-xl shrink-0">error</span>
                  <p className="font-medium pt-0.5">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative group">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-11 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                      placeholder="name@company.com"
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">mail</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mật khẩu</label>
                    <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">Quên mật khẩu?</a>
                  </div>
                  <div className="relative group">
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 px-11 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                      placeholder="••••••••"
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">lock</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="relative flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/20 cursor-pointer transition-all"
                    />
                    <label htmlFor="remember" className="ml-3 text-sm font-medium text-slate-600 cursor-pointer select-none peer-checked:text-indigo-700 transition-colors">Duy trì đăng nhập trong 7 ngày</label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="animate-spin material-symbols-outlined text-xl">progress_activity</span>
                  ) : (
                    <>
                      ĐĂNG NHẬP
                      <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-400">Hoặc</span>
                </div>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-slate-500">
                  Chưa có tài khoản?
                  <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline ml-1.5 transition-colors">
                    Đăng ký tài khoản mới
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="w-full text-center py-6 shrink-0">
            <p className="text-xs text-slate-400 font-medium">© 2024 KynguyenRealAI Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
