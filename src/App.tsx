
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, UserRole } from './contexts/AuthContext';
import { BrandingProvider, useBranding } from './contexts/BrandingContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { FeatureKey } from './types/subscription';

// Core Pages
import Home from './modules/core/pages/Home';
import About from './modules/core/pages/About';
import Solutions from './modules/core/pages/Solutions';
import Contact from './modules/core/pages/Contact';
import PrivacyPolicy from './modules/core/pages/PrivacyPolicy';
import TermsOfUse from './modules/core/pages/TermsOfUse';
import FAQ from './modules/core/pages/FAQ';
import Dashboard from './modules/core/pages/Dashboard';
import MarketTrends from './modules/core/pages/MarketTrends';
import FinancialAnalytics from './modules/core/pages/FinancialAnalytics';
import MarketingDashboard from './modules/core/pages/MarketingDashboard';
import Services from './modules/core/pages/Services';

// Auth Pages
import Login from './modules/auth/pages/Login';
import Register from './modules/auth/pages/Register';
import ReferralHandler from './modules/auth/pages/ReferralHandler';

// Property Pages
import Products from './modules/property/pages/PropertyList';
import ProductDetail from './modules/property/pages/PropertyDetail';
import RealEstateHome from './modules/property/pages/HomeLanding';
import LuxeHome from './modules/property/pages/LuxeHome';
import ManageProperties from './modules/property/pages/AdminPropertyList';
import ProjectLanding from './modules/property/pages/ProjectLanding';
import LandingPageBuilder from './modules/property/pages/LandingPageBuilder';

// News Pages
import News from './modules/news/pages/NewsList';
import ArticleDetail from './modules/news/pages/NewsDetail';
import NewsManagement from './modules/news/pages/AdminNewsList';
import AddEditNews from './modules/news/pages/NewsEditor';
import CategoryManagement from './modules/news/pages/CategoryManager';
import TagManagement from './modules/news/pages/TagManager';

// Customer & Sales Pages
import ManageCustomers from './modules/customer/pages/CustomerList';
import CustomerDetail from './modules/customer/pages/CustomerDetail';
import ConsultationRequests from './modules/customer/pages/ConsultationList';
import ManageOrders from './modules/sales/pages/OrderList';
import CreateOrder from './modules/sales/pages/OrderEditor';
import OrderPrint from './modules/sales/pages/OrderPrint';

// System Pages
import Settings from './modules/system/pages/Settings';
import ManageContact from './modules/system/pages/ContactManager';
import UserManagement from './modules/system/pages/UserManagement';
import SystemLogs from './modules/system/pages/SystemLogs';
import ManageServices from './modules/system/pages/ServiceManager';
import ManageAbout from './modules/system/pages/AboutManager';
import SocialMediaAgent from './modules/system/pages/SocialAgent';
import MySubscription from './modules/system/pages/MySubscription';
import AccountSettings from './modules/system/pages/AccountSettings';

// Platform (Super Admin) Pages
import PlatformLayout from './modules/platform/layouts/PlatformLayout';
import PlatformDashboard from './modules/platform/pages/PlatformDashboard';
import TenantManager from './modules/platform/pages/TenantManager';
import BrandingSettings from './modules/system/pages/BrandingSettings';
import SubscriptionManager from './modules/platform/pages/SubscriptionManager';
import PlatformSettings from './modules/platform/pages/PlatformSettings';
import PlatformFinance from './modules/platform/pages/PlatformFinance';
import InstallPWA from './components/InstallPWA';
import PlatformLanding from './modules/platform/pages/PlatformLanding';
import TenantRegister from './modules/platform/pages/TenantRegister';
import { HelmetProvider } from 'react-helmet-async';
import DashboardLayout from './modules/core/layouts/DashboardLayout';

import Footer from './components/Footer';
import LuxeFooter from './components/LuxeFooter';
import LuxeNavbar from './components/LuxeNavbar';

// Component hỗ trợ tự động cuộn lên đầu trang khi chuyển Route
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const { tenantId: currentTenantId } = useBranding();

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-background-light">
      <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
    </div>
  );

  if (!currentUser) return <Navigate to="/login" />;

  // role check
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" />;
  }

  // Tenant Isolation Check
  // If we are in a tenant context (currentTenantId exists)
  // And the user is NOT a super_admin
  // And the user's tenantId does not match the current tenant
  if (currentTenantId && userProfile?.role !== 'super_admin' && userProfile?.tenantId !== currentTenantId) {
    console.warn(`Access Denied: User ${userProfile?.email} (Tenant: ${userProfile?.tenantId}) tried to access Tenant: ${currentTenantId}`);
    // Redirect to a specific "Unauthorized" page or just home (which handles tenant routing)
    // Or maybe logout the user? For now, redirect to login might be safer or show an error.
    // Let's redirect to login to force them to switch accounts or login properly.
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Truy cập bị từ chối</h1>
        <p className="text-slate-500 mb-6">Tài khoản của bạn không thuộc về Tenant này.</p>
        <Link to="/" className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Về trang chủ</Link>
      </div>
    );
  }

  return <>{children}</>;
};


const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const { branding } = useBranding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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

  return (
    <>
      <nav className="sticky top-0 z-50 w-full transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 lg:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-8 lg:h-10 w-auto object-contain transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex size-9 lg:size-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                  <span className="material-symbols-outlined text-xl lg:text-2xl filled-icon">apartment</span>
                </div>
              )}
              {!branding.logoUrl && (
                <h1 className="font-display text-lg lg:text-xl font-bold tracking-tight text-primary uppercase line-clamp-1">
                  {branding.companyName || 'KyNguyen Real AI'}
                </h1>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100/50">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wide ${isActive(link.path)
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-100'
                  : 'text-slate-500 hover:text-primary hover:bg-white/50'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <>
                {isStaff ? (
                  <Link to={dashboardPath} className="h-11 px-6 flex items-center gap-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5">
                    <span>Dashboard</span>
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                  </Link>
                ) : (
                  <Link to="/settings" className="size-11 flex items-center justify-center rounded-xl border-2 border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-white transition-all">
                    <span className="material-symbols-outlined">settings</span>
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="h-11 px-5 flex items-center justify-center rounded-xl text-sm font-bold text-slate-500 hover:text-primary hover:bg-slate-50 transition-all">
                  Đăng Nhập
                </Link>
                <Link to="/register" className="h-11 px-6 flex items-center justify-center rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div className={`absolute top-0 right-0 h-full w-[80%] max-w-[320px] bg-white shadow-2xl transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-xl font-bold text-primary">Menu</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive(link.path)
                    ? 'bg-primary/5 text-primary'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <span className="material-symbols-outlined text-xl opacity-70">
                    {link.name === 'Trang Chủ' ? 'home' :
                      link.name === 'Nhà Đất' ? 'apartment' :
                        link.name === 'Dịch Vụ' ? 'design_services' :
                          link.name === 'Tin Tức' ? 'newspaper' :
                            link.name === 'Giới Thiệu' ? 'info' : 'contact_mail'}
                  </span>
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              {currentUser ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {userProfile?.displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-800 truncate">{userProfile?.displayName || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
                    </div>
                  </div>
                  {isStaff ? (
                    <Link to={dashboardPath} className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25">
                      Truy cập Dashboard
                    </Link>
                  ) : (
                    <Link to="/settings" className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                      <span className="material-symbols-outlined">settings</span> Cài đặt tài khoản
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" className="h-12 flex items-center justify-center rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 transition-colors">
                    Đăng Nhập
                  </Link>
                  <Link to="/register" className="h-12 flex items-center justify-center rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark transition-colors">
                    Đăng Ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrandingProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <InstallPWA />
          <HelmetProvider>
            <AppRoutes />
          </HelmetProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrandingProvider>
  );
};

// Extracted Routes component to use useBranding hook
const AppRoutes: React.FC = () => {
  const { tenantId, loading, branding } = useBranding();

  if (loading) return null; // Or a splash screen

  console.log("Current Branding State:", branding);
  console.log("Selected Template:", branding.homeTemplateId);

  // Dynamic Home Component
  // MIGRATION: 'default' now maps to LuxeHome to ensure all users see the new design
  const isLuxe = branding.homeTemplateId === 'luxe' || branding.homeTemplateId === 'default';

  const HomeComponent = isLuxe ? LuxeHome : RealEstateHome;
  const FooterComponent = isLuxe ? LuxeFooter : Footer;
  const NavbarComponent = isLuxe ? LuxeNavbar : Navbar;

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Routes>
          <Route path="/" element={
            !tenantId ? (
              <PlatformLanding />
            ) : (
              <><NavbarComponent /><HomeComponent /><FooterComponent /></>
            )
          } />
          <Route path="/about" element={<><NavbarComponent /><About /><FooterComponent /></>} />
          <Route path="/solutions" element={<><NavbarComponent /><Solutions /><FooterComponent /></>} />
          <Route path="/services" element={<><NavbarComponent /><Services /><FooterComponent /></>} />
          <Route path="/contact" element={<><NavbarComponent /><Contact /><FooterComponent /></>} />
          <Route path="/products" element={<><NavbarComponent /><Products /><FooterComponent /></>} />
          <Route path="/products/:id" element={<><NavbarComponent /><ProductDetail /><FooterComponent /></>} />
          <Route path="/du-an/:slug" element={<ProjectLanding />} />
          <Route path="/project/:slug" element={<ProjectLanding />} />
          <Route path="/landing-builder/:propertyId" element={<ProtectedRoute allowedRoles={['admin', 'marketing']}><LandingPageBuilder /></ProtectedRoute>} />
          <Route path="/news" element={<><Navbar /><News /><Footer /></>} />
          <Route path="/news/:id" element={<><Navbar /><ArticleDetail /><Footer /></>} />
          <Route path="/privacy" element={<><Navbar /><PrivacyPolicy /><Footer /></>} />
          <Route path="/terms" element={<><Navbar /><TermsOfUse /><Footer /></>} />
          <Route path="/faq" element={<><Navbar /><FAQ /><Footer /></>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tenant/register" element={<TenantRegister />} />
          <Route path="/ref/:code" element={<ReferralHandler />} />

          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'marketing', 'super_admin']}><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/manage-properties" element={<ProtectedRoute allowedRoles={['admin', 'marketing', 'super_admin']}><DashboardLayout><ManageProperties /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
          <Route path="/market-trends" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'marketing', 'super_admin']}><DashboardLayout><MarketTrends /></DashboardLayout></ProtectedRoute>} />
          <Route path="/consultations" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><ConsultationRequests /></DashboardLayout></ProtectedRoute>} />
          <Route path="/manage-orders" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><ManageOrders /></DashboardLayout></ProtectedRoute>} />
          <Route path="/financial-analytics" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><FinancialAnalytics /></DashboardLayout></ProtectedRoute>} />
          <Route path="/marketing-analytics" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><MarketingDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/manage-customers" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><ManageCustomers /></DashboardLayout></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><CustomerDetail /></DashboardLayout></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['doctor', 'marketing', 'admin', 'super_admin']}><DashboardLayout><CreateOrder /></DashboardLayout></ProtectedRoute>} />
          <Route path="/orders/:id/print" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><OrderPrint /></ProtectedRoute>} />

          <Route path="/manage-news" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><NewsManagement /></DashboardLayout></ProtectedRoute>} />
          <Route path="/manage-categories" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><CategoryManagement /></DashboardLayout></ProtectedRoute>} />
          <Route path="/manage-tags" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><TagManagement /></DashboardLayout></ProtectedRoute>} />
          <Route path="/social-agent" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><SocialMediaAgent /></DashboardLayout></ProtectedRoute>} />
          <Route path="/manage-services" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><ManageServices /></DashboardLayout></ProtectedRoute>} />
          <Route path="/manage-about" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><ManageAbout /></DashboardLayout></ProtectedRoute>} />
          <Route path="/manage-contact" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><ManageContact /></DashboardLayout></ProtectedRoute>} />
          <Route path="/edit-news" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><AddEditNews /></DashboardLayout></ProtectedRoute>} />
          <Route path="/edit-news/:id" element={<ProtectedRoute allowedRoles={['marketing', 'admin', 'super_admin']}><DashboardLayout><AddEditNews /></DashboardLayout></ProtectedRoute>} />

          <Route path="/manage-users" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DashboardLayout><UserManagement /></DashboardLayout></ProtectedRoute>} />
          <Route path="/system-logs" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DashboardLayout><SystemLogs /></DashboardLayout></ProtectedRoute>} />
          <Route path="/my-subscription" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DashboardLayout><MySubscription /></DashboardLayout></ProtectedRoute>} />
          <Route path="/account-settings" element={<ProtectedRoute><DashboardLayout><AccountSettings /></DashboardLayout></ProtectedRoute>} />

          {/* Platform Routes (Super Admin) */}
          <Route path="/platform/dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><PlatformLayout><PlatformDashboard /></PlatformLayout></ProtectedRoute>} />
          <Route path="/platform/tenants" element={<ProtectedRoute allowedRoles={['super_admin']}><PlatformLayout><TenantManager /></PlatformLayout></ProtectedRoute>} />
          <Route path="/platform/subscriptions" element={<ProtectedRoute allowedRoles={['super_admin']}><PlatformLayout><SubscriptionManager /></PlatformLayout></ProtectedRoute>} />
          <Route path="/platform/finance" element={<ProtectedRoute allowedRoles={['super_admin']}><PlatformLayout><PlatformFinance /></PlatformLayout></ProtectedRoute>} />
          <Route path="/platform/settings" element={<ProtectedRoute allowedRoles={['super_admin']}><PlatformLayout><PlatformSettings /></PlatformLayout></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
