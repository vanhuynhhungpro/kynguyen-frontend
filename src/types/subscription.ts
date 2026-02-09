
export type FeatureKey =
    | 'ai_writer'
    | 'social_agent'
    | 'market_trends'
    | 'financial_analytics'
    | 'marketing_analytics'
    | 'landing_page_builder'
    | 'crm_advanced';

export interface FeatureDefinition {
    key: FeatureKey;
    label: string;
    description: string;
}

export const CANONICAL_FEATURES: FeatureDefinition[] = [
    { key: 'ai_writer', label: 'AI Writer (Tin tức)', description: 'Tự động viết bài tin tức, blog bằng AI.' },
    { key: 'social_agent', label: 'AI Social Agent', description: 'Tự động đăng bài lên Facebook/Zalo.' },
    { key: 'landing_page_builder', label: 'Landing Page Builder', description: 'Kéo thả tạo Landing Page cho dự án.' },
    { key: 'market_trends', label: 'Dữ liệu Thị trường', description: 'Xem biểu đồ xu hướng giá và thị trường (Google Trends, Batdongsan.com.vn).' },
    { key: 'financial_analytics', label: 'Báo cáo Tài chính', description: 'Xem lợi nhuận, hoa hồng, dòng tiền, KPI.' },
    { key: 'marketing_analytics', label: 'Marketing ROI', description: 'Phân tích hiệu quả chiến dịch quảng cáo.' },
    { key: 'crm_advanced', label: 'CRM Nâng cao', description: 'Tính năng chăm sóc khách hàng tự động.' },
];

export interface SubscriptionLimit {
    maxProperties: number; // -1 for unlimited
    maxUsers: number;
    maxStorageGB: number;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    // Display features (UI text for pricing page)
    features: string[];
    // Technical Gates (Logic checks)
    featureFlags: Partial<Record<FeatureKey, boolean>>;
    limits: SubscriptionLimit;
    status: 'active' | 'inactive';
    updatedAt?: any;
}

export const DEFAULT_PLANS: SubscriptionPlan[] = [
    {
        id: 'basic',
        name: 'Gói Cơ Bản (Basic)',
        price: 500000,
        currency: 'VND',
        features: ['Quản lý 50 BĐS', '3 Tài khoản', 'Cơ bản Analytics'],
        featureFlags: {
            ai_writer: false,
            social_agent: false,
            market_trends: false,
            financial_analytics: false,
            marketing_analytics: false,
            landing_page_builder: false,
            crm_advanced: false
        },
        limits: { maxProperties: 50, maxUsers: 3, maxStorageGB: 1 },
        status: 'active'
    },
    {
        id: 'pro',
        name: 'Gói Chuyên Nghiệp (Pro)',
        price: 2000000,
        currency: 'VND',
        features: ['Quản lý 500 BĐS', '10 Tài khoản', 'AI Social Agent', 'AI Writer'],
        featureFlags: {
            ai_writer: true,
            social_agent: true,
            market_trends: true,
            financial_analytics: false,
            marketing_analytics: true,
            landing_page_builder: true,
            crm_advanced: false
        },
        limits: { maxProperties: 500, maxUsers: 10, maxStorageGB: 10 },
        status: 'active'
    },
    {
        id: 'enterprise',
        name: 'Gói Doanh Nghiệp (Enterprise)',
        price: 5000000,
        currency: 'VND',
        features: ['Không giới hạn BĐS', 'Full AI Features', 'Hỗ trợ 24/7'],
        featureFlags: {
            ai_writer: true,
            social_agent: true,
            market_trends: true,
            financial_analytics: true,
            marketing_analytics: true,
            landing_page_builder: true,
            crm_advanced: true
        },
        limits: { maxProperties: -1, maxUsers: -1, maxStorageGB: 100 },
        status: 'active'
    }
];
