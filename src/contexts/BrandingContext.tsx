import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { TenantService, TenantConfig } from '../services/tenantService';

interface BrandingSettings {
    logoUrl?: string; // URL to the uploaded logo
    faviconUrl?: string;
    primaryColor: string;
    primaryDarkColor: string;
    accentColor: string;
    accentLightColor: string;
    companyName: string;
    // Advanced Customization
    fontFamily: string; // 'inter', 'playfair', etc.
    borderRadius: string; // 'none', 'sm', 'md', 'lg', 'full'
    headerStyle: 'default' | 'centered' | 'minimal';
    heroImageUrl?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    // Page Banners
    productsBanner?: string;
    servicesBanner?: string;
    newsBanner?: string;
    aboutBanner?: string;
    loginBannerUrl?: string;
    // Template System
    homeTemplateId: 'default' | 'luxe';
}

interface BrandingContextType {
    branding: BrandingSettings;
    updateBranding: (settings: Partial<BrandingSettings>) => Promise<void>;
    applyPreset: (presetKey: keyof typeof ThemePresets) => Promise<void>;
    loading: boolean;
    tenantId: string | null;
}

const defaultBranding: BrandingSettings = {
    primaryColor: '#4338ca', // Indigo 700 - Modern & Trustworthy
    primaryDarkColor: '#312e81', // Indigo 900
    accentColor: '#fbbf24', // Amber 400 - Gold/Luxury
    accentLightColor: '#fffbeb', // Amber 50
    companyName: 'Tên Công Ty Của Bạn', // Generic default
    fontFamily: 'inter',
    borderRadius: 'md',
    headerStyle: 'default',
    homeTemplateId: 'luxe', // Default to LuxeEstates design
    heroImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80',
    heroTitle: 'Kiến Tạo Không Gian Sống Đẳng Cấp',
    heroSubtitle: 'Khám phá bộ sưu tập bất động sản tinh hoa được tuyển chọn dành riêng cho bạn',
    productsBanner: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80',
    servicesBanner: 'https://images.unsplash.com/photo-1581094794329-cd119277f368?auto=format&fit=crop&q=80',
    newsBanner: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80',
    aboutBanner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80',
    loginBannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80',
};

export const ThemePresets = {
    future_city: {
        name: 'Future City (Công Nghệ)',
        colors: { primary: '#0f172a', primaryDark: '#020617', accent: '#4f46e5', accentLight: '#eef2ff' }, // Navy & Indigo
        font: 'outfit',
        radius: 'md'
    },
    royal_prestige: {
        name: 'Royal Prestige (Sang Trọng)',
        colors: { primary: '#1c1917', primaryDark: '#0c0a09', accent: '#d97706', accentLight: '#fffbeb' }, // Matte Black & Gold
        font: 'playfair',
        radius: 'none'
    },
    zen_retreat: {
        name: 'Zen Retreat (Nghỉ Dưỡng)',
        colors: { primary: '#3f6212', primaryDark: '#1a2e05', accent: '#a8a29e', accentLight: '#f5f5f4' }, // Moss Green & Stone
        font: 'space',
        radius: 'lg'
    }
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Apply CSS Variables
    const applyTheme = (settings: BrandingSettings) => {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', settings.primaryColor);
        root.style.setProperty('--color-primary-dark', settings.primaryDarkColor);
        root.style.setProperty('--color-accent', settings.accentColor);
        root.style.setProperty('--color-accent-light', settings.accentLightColor);

        // Apply Radius
        const radiusMap: Record<string, string> = {
            'none': '0px',
            'sm': '0.25rem', // 4px
            'md': '0.75rem', // 12px
            'lg': '1.5rem',  // 24px
            'full': '9999px'
        };
        root.style.setProperty('--radius', radiusMap[settings.borderRadius] || '0.75rem');

        // Apply Fonts
        const fontMap: Record<string, { display: string, body: string }> = {
            'outfit': { display: "'Outfit', sans-serif", body: "'Inter', sans-serif" },
            'inter': { display: "'Inter', sans-serif", body: "'Inter', sans-serif" },
            'playfair': { display: "'Playfair Display', serif", body: "'Inter', sans-serif" },
            'space': { display: "'Space Grotesk', sans-serif", body: "'Be Vietnam Pro', sans-serif" },
            'roboto': { display: "'Roboto', sans-serif", body: "'Roboto', sans-serif" },
        };
        const fonts = fontMap[settings.fontFamily] || fontMap['inter'];
        root.style.setProperty('--font-display', fonts.display);
        root.style.setProperty('--font-body', fonts.body);
    };

    useEffect(() => {
        let unsubscribe: () => void;

        const initTenant = async () => {
            const hostname = window.location.hostname;
            console.log("Resolving tenant for hostname:", hostname);
            const tenant = await TenantService.resolveTenant(hostname);

            if (tenant) {
                console.log("Tenant found:", tenant.id);
                setTenantId(tenant.id);

                // Affiliate Tracking: Lưu ownerId của tenant hiện tại làm Ref cho người truy cập
                if (tenant.ownerId) {
                    console.log("Setting Affiliate Ref:", tenant.ownerId);
                    localStorage.setItem('REF_CODE', tenant.ownerId);
                }

                // Subscribe to Tenant specific settings
                const docRef = doc(db, 'tenants', tenant.id);
                unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const tenantData = docSnap.data() as TenantConfig;
                        console.log("🔥 Firestore Tenant Data:", tenantData);
                        // Merge with defaults to ensure all fields exist
                        const mergedBranding: BrandingSettings = {
                            ...defaultBranding,
                            ...(tenantData.branding as Partial<BrandingSettings>),
                            ...(tenantData.settings as Partial<BrandingSettings>) // Assuming settings might also contain branding fields
                        };
                        setBranding(mergedBranding);
                        applyTheme(mergedBranding);
                        console.log("🔥 Merged Branding:", mergedBranding);
                    }
                    setLoading(false);
                });
            } else {
                console.log("No tenant found, falling back to legacy single-tenant mode.");
                // Fallback: Legacy Single Instance
                const docRef = doc(db, 'site_settings', 'config');
                unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data() as Partial<BrandingSettings>;
                        const merged: BrandingSettings = {
                            ...defaultBranding,
                            ...data,
                        };
                        setBranding(merged);
                        applyTheme(merged);
                    } else {
                        // Just use default branding, don't try to write to DB if user is not admin
                        console.log("No site config found, using defaults.");
                        applyTheme(defaultBranding);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching site settings:", error);
                    // Fallback to default branding on error (e.g., permission denied)
                    applyTheme(defaultBranding);
                    setLoading(false);
                });
            }
        };

        initTenant();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const updateBranding = async (newSettings: Partial<BrandingSettings>) => {
        if (tenantId) {
            // Update Tenant Document
            const docRef = doc(db, 'tenants', tenantId);
            await setDoc(docRef, { branding: newSettings }, { merge: true });
        } else {
            // Update Legacy Document
            const docRef = doc(db, 'site_settings', 'config');
            await setDoc(docRef, newSettings, { merge: true });
        }
    };

    const applyPreset = async (presetKey: keyof typeof ThemePresets) => {
        const preset = ThemePresets[presetKey];
        if (!preset) return;

        const newSettings: Partial<BrandingSettings> = {
            primaryColor: preset.colors.primary,
            primaryDarkColor: preset.colors.primaryDark,
            accentColor: preset.colors.accent,
            accentLightColor: preset.colors.accentLight,
            fontFamily: preset.font,
            borderRadius: preset.radius
        };

        // Update local state immediately for responsiveness
        setBranding(prev => {
            const merged = { ...prev, ...newSettings };
            applyTheme(merged);
            return merged;
        });

        // Save to DB
        await updateBranding(newSettings);
    };

    return (
        <BrandingContext.Provider value={{ branding, updateBranding, applyPreset, loading, tenantId }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (!context) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
