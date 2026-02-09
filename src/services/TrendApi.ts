
import { GoogleGenAI, Type } from "@google/genai";

export interface TrendKPI {
  label: string;
  value: string;
  trend: string;
  color: string;
  icon: string;
  status: 'up' | 'down' | 'stable';
  tooltip: string;
}

export interface TrendItem {
  id: string;
  title: string;
  industry: 'REAL_ESTATE' | 'INTERIOR' | 'CONSTRUCTION';
  subtitle: string;
  score: number;
  delta_pct: number;
  spark_data: number[];
}

export interface TrendDetail extends TrendItem {
  description: string;
  timeseries: { date: string; value: number; forecast?: number }[];
  regions: { name: string; value: number }[];
  related_keywords: { term: string; score: number; type: 'breakout' | 'top' }[];
  market_insights: {
    investment_strategy: string;
    liquidity_potential: string;
    legal_notes: string;
  };
}

export const TrendApi = {
  getSummary: async (params: { industry: string; timeframe: string }): Promise<TrendKPI[]> => {
    // Giả lập dữ liệu thị trường Bất Động Sản
    return [
      { label: 'GIÁ CHUNG CƯ', value: '55tr/m²', trend: '+5.2%', color: 'primary', icon: 'apartment', status: 'up', tooltip: 'Giá trung bình căn hộ hạng B tại TP.HCM' },
      { label: 'LÃI SUẤT VAY', value: '6.5%', trend: '-0.5%', color: 'accent', icon: 'percent', status: 'down', tooltip: 'Lãi suất thả nổi trung bình nhóm Big4' },
      { label: 'NGUỒN CUNG MỚI', value: '2.500', trend: '+15%', color: 'emerald-500', icon: 'domain_add', status: 'up', tooltip: 'Số lượng căn hộ mở bán mới trong quý' },
      { label: 'TỶ LỆ HẤP THỤ', value: '78%', trend: 'Tích cực', color: 'blue-500', icon: 'handshake', status: 'stable', tooltip: 'Tỷ lệ giao dịch thành công trên nguồn cung' },
      { label: 'LUẬT ĐẤT ĐAI', value: 'Hiệu lực', trend: 'Mới', color: 'indigo-500', icon: 'gavel', status: 'stable', tooltip: 'Luật Đất đai sửa đổi bắt đầu có hiệu lực' },
      { label: 'KHU VỰC HOT', value: 'Khu Đông', trend: 'Sôi động', color: 'rose-500', icon: 'location_on', status: 'up', tooltip: 'Khu vực có lượng tìm kiếm cao nhất' }
    ];
  },

  getTrends: async (params: { industry: string; timeframe: string }): Promise<TrendItem[]> => {
    return [
      { id: 'can-ho-dich-vu', title: 'Căn hộ dịch vụ', industry: 'REAL_ESTATE', subtitle: 'Xu hướng đầu tư dòng tiền', score: 98, delta_pct: 15, spark_data: [30, 45, 40, 60, 80, 95, 100] },
      { id: 'dat-nen-vung-ven', title: 'Đất nền vùng ven', industry: 'REAL_ESTATE', subtitle: 'Sóng hạ tầng Vành đai 3', score: 82, delta_pct: -5, spark_data: [70, 75, 72, 78, 80, 82, 85] },
      { id: 'smart-home', title: 'Smart Home Living', industry: 'INTERIOR', subtitle: 'Tiêu chuẩn bàn giao mới', score: 76, delta_pct: 8, spark_data: [60, 62, 65, 63, 68, 72, 76] },
      { id: 'green-building', title: 'Green Building', industry: 'CONSTRUCTION', subtitle: 'Chứng chỉ xanh LOTUS/LEED', score: 92, delta_pct: 24, spark_data: [20, 35, 50, 65, 80, 90, 95] }
    ];
  },

  getTrendDetail: async (id: string): Promise<TrendDetail> => {
    // Dữ liệu mẫu ban đầu
    return {
      id,
      title: id === 'can-ho-dich-vu' ? 'Căn hộ dịch vụ cho thuê' : 'Đất nền vùng ven',
      industry: 'REAL_ESTATE',
      subtitle: 'Phân khúc đầu tư an toàn trong bối cảnh mới',
      score: 95,
      delta_pct: 30,
      spark_data: [1,2,3,4,5],
      description: 'Dữ liệu đang được phân tích bởi hệ thống AI Bất Động Sản...',
      timeseries: [
        { date: 'Th01', value: 40 }, { date: 'Th02', value: 55 }, { date: 'Th03', value: 48 },
        { date: 'Th04', value: 70 }, { date: 'Th05', value: 85 }, { date: 'Th06', value: 95 }
      ],
      regions: [{ name: 'TP.HCM', value: 80 }, { name: 'Hà Nội', value: 95 }],
      related_keywords: [{ term: 'Airbnb', score: 90, type: 'top' }, { term: 'Studio Apartment', score: 85, type: 'breakout' }],
      market_insights: {
        investment_strategy: 'Tập trung vào vị trí gần các trường đại học và khu văn phòng.',
        liquidity_potential: 'Biến động giá thuê ổn định, tỷ lệ lấp đầy >85%.',
        legal_notes: 'Cần lưu ý quy định PCCC mới nhất.'
      }
    };
  },

  analyzeWithAI: async (topic: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Phân tích chuyên sâu về xu hướng bất động sản "${topic}" tại thị trường Việt Nam.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            market_insights: {
              type: Type.OBJECT,
              properties: {
                investment_strategy: { type: Type.STRING },
                liquidity_potential: { type: Type.STRING },
                legal_notes: { type: Type.STRING }
              }
            },
            related_keywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  type: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  }
};
