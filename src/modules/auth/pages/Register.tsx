
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [accountType, setAccountType] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Affiliate Tracking: Capture Ref Code from URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('REF_CODE', refCode);
      console.log("Captured Affiliate Ref:", refCode);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agree) {
      return setError('Vui lòng đồng ý với điều khoản sử dụng.');
    }

    if (password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }

    if (password.length < 6) {
      return setError('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    try {
      setError('');
      setLoading(true);
      await register(email, password, fullName, company, phone, accountType);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được sử dụng.');
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 relative overflow-hidden font-body">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />

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

      <div className="w-full flex flex-col lg:flex-row min-h-screen">
        {/* Left Side: Hero Image & Brand */}
        <div className="hidden lg:flex lg:w-5/12 relative bg-slate-900 overflow-hidden text-white p-12 flex-col justify-between fixed lg:sticky top-0 h-screen">
          <div className="absolute inset-0 z-0">
            <img
              alt="Real Estate"
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000"
              className="w-full h-full object-cover opacity-50 mix-blend-overlay scale-110 blur-[2px]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-900/50" />
          </div>

          <div className="relative z-10 animate-in slide-in-from-left-8 duration-700 fade-in">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-inner">
              <span className="material-symbols-outlined text-3xl text-accent">apartment</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-display font-bold leading-tight mb-6">
              Kiến tạo <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-400">Tương lai số</span>
            </h2>
            <p className="text-slate-300 font-light leading-relaxed text-lg max-w-sm">
              Gia nhập cộng đồng hơn 5,000+ chuyên gia Bất động sản và tiếp cận kho hàng độc quyền ngay hôm nay.
            </p>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex -space-x-3">
                <div className="size-10 rounded-full bg-accent border-2 border-slate-800 flex items-center justify-center text-xs font-bold shadow-md">JD</div>
                <div className="size-10 rounded-full bg-slate-300 border-2 border-slate-800 flex items-center justify-center text-slate-800 text-xs font-bold shadow-md">AL</div>
                <div className="size-10 rounded-full bg-white border-2 border-slate-800 flex items-center justify-center text-slate-800 text-xs font-bold shadow-md">+2k</div>
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Thành viên đối tác</span>
                <span className="text-xs text-slate-400">Đã tham gia cùng chúng tôi</span>
              </div>
            </div>
            <p className="text-[10px] text-white/40 font-display tracking-widest uppercase">© 2024 LUCELAND PLATFORM</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-7/12 flex flex-col justify-between bg-white h-screen relative overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20">
            <div className="max-w-xl mx-auto w-full animate-in slide-in-from-right-8 duration-500 fade-in">
              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-2">Đăng Ký Tài Khoản</h1>
                <p className="text-slate-500 text-base">Hoàn toàn miễn phí và chỉ mất chưa đầy 30 giây.</p>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Họ và tên</label>
                  <div className="relative group">
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                      placeholder="Nguyễn Văn A"
                      type="text"
                    />
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">person</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Số điện thoại</label>
                    <div className="relative group">
                      <input
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                        placeholder="090x xxx xxx"
                        type="tel"
                      />
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">phone</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative group">
                      <input
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                        placeholder="name@company.com"
                        type="email"
                      />
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">mail</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Công ty / Thương hiệu</label>
                    <div className="relative group">
                      <input
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                        placeholder="Công ty TNHH..."
                        type="text"
                      />
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">business</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Vai trò</label>
                    <div className="relative group">
                      <select
                        required
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full h-12 pl-11 pr-10 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Chọn vai trò</option>
                        <option value="agent">Môi giới viên (Agent)</option>
                        <option value="investor">Chủ đầu tư (Investor)</option>
                        <option value="partner">Đối tác phân phối</option>
                        <option value="manager">Quản lý sàn</option>
                      </select>
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">badge</span>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Mật khẩu</label>
                    <div className="relative group">
                      <input
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                        placeholder="••••••••"
                        type="password"
                      />
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">lock</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Xác nhận</label>
                    <div className="relative group">
                      <input
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                        placeholder="••••••••"
                        type="password"
                      />
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors text-xl">lock_reset</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-1 size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/20 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-500 leading-tight cursor-pointer select-none">
                    Tôi cam kết thông tin cung cấp là chính xác và đồng ý với <Link to="/terms" className="text-indigo-600 font-bold hover:underline">Điều khoản sử dụng</Link> của LUCE BIO TECH.
                  </label>
                </div>

                <button
                  disabled={loading}
                  className="group w-full h-14 bg-indigo-600 text-white rounded-xl font-bold text-base tracking-wider hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  type="submit"
                >
                  {loading ? (
                    <span className="animate-spin material-symbols-outlined text-xl">progress_activity</span>
                  ) : (
                    <>
                      ĐĂNG KÝ NGAY
                      <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600">
                  Bạn đã có tài khoản rồi?
                  <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline transition-colors ml-1.5">Đăng nhập</Link>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center py-6 shrink-0">
            <p className="text-xs text-slate-400 font-medium">© 2024 KynguyenRealAI Platform. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
