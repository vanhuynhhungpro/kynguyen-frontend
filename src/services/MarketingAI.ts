
/**
 * Marketing AI Agent Service
 * Analyzes financial and conversion data to provide actionable recommendations.
 */

export interface CampaignMetrics {
    name: string;
    views: number;
    leads: number;
    conversions: number; // Orders/Deposits
    adSpend: number; // Cost
    revenue: number;
}

export interface AnalysisResult {
    roi: number; // %
    cpa: number; // Cost Per Action (Lead)
    conversionRate: number; // %
    status: 'excellent' | 'good' | 'warning' | 'critical';
    recommendation: string;
    reasoning: string;
}

export const analyzeCampaign = (data: CampaignMetrics): AnalysisResult => {
    const { views, leads, adSpend, revenue } = data;

    // 1. Calculate Core Metrics
    const roi = adSpend > 0 ? ((revenue - adSpend) / adSpend) * 100 : 0;
    const cpa = leads > 0 ? adSpend / leads : adSpend;
    const conversionRate = views > 0 ? (leads / views) * 100 : 0;

    // 2. Logic Engine
    let status: AnalysisResult['status'] = 'good';
    let recommendation = '';
    let reasoning = '';

    // Case 1: High ROI (Money Printing Machine)
    if (roi > 200 && adSpend > 0) {
        status = 'excellent';
        recommendation = 'TĂNG NGÂN SÁCH NGAY LẬP TỨC (SCALE UP)';
        reasoning = `Chiến dịch đang tạo ra lợi nhuận khủng (${roi.toFixed(0)}%). Mỗi 1 đồng bỏ ra thu về ${(revenue / adSpend).toFixed(1)} đồng. Cần mở rộng quy mô để chiếm lĩnh thị phần.`;
    }

    // Case 2: Profitable but could be better
    else if (roi > 20 && roi <= 200) {
        status = 'good';
        recommendation = 'DUY TRÌ VÀ TỐI ƯU CÁC KÊNH PHỤ';
        reasoning = `Hiệu quả tốt. Đang có lãi ổn định. Nên thử nghiệm thêm các mẫu quảng cáo mới để giảm CPA (Hiện tại: ${formatCurrency(cpa)})`;
    }

    // Case 3: Breaking Even or Slight Loss (Need Optimization)
    else if (roi > -20 && roi <= 20) {
        status = 'warning';

        if (conversionRate < 1) {
            recommendation = 'KIỂM TRA LẠI LANDING PAGE / NỘI DUNG';
            reasoning = `Có traffic nhưng khách không điền form (CR: ${conversionRate.toFixed(2)}%). Có thể nội dung chưa thuyết phục hoặc sai tệp khách hàng.`;
        } else {
            recommendation = 'TỐI ƯU GIÁ THẦU (BIDDING)';
            reasoning = `Tỷ lệ chuyển đổi ổn (${conversionRate.toFixed(2)}%) nhưng giá thầu đang quá cao khiến lợi nhuận mỏng.`;
        }
    }

    // Case 4: Money Pit (Deep Loss)
    else {
        status = 'critical';
        if (views < 100) {
            recommendation = 'CHỜ THÊM DỮ LIỆU (HOẶC TĂNG REACH)';
            reasoning = 'Chưa đủ dữ liệu để kết luận. Cần chạy thêm để có ít nhất 100-200 lượt xem.';
        } else {
            recommendation = 'CẮT GIẢM NGÂN SÁCH / DỪNG CHIẾN DỊCH';
            reasoning = `Đang lỗ nặng (${roi.toFixed(0)}%). CPA quá cao (${formatCurrency(cpa)}). Chiến dịch này không hiệu quả, cần tắt ngay để tránh lãng phí.`;
        }
    }

    return {
        roi,
        cpa,
        conversionRate,
        status,
        recommendation,
        reasoning
    };
};

// Helper
const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};
