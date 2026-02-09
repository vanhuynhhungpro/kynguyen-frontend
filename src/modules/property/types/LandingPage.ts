export interface LandingSection {
  id: string;
  type?: 'content' | 'features' | 'agent' | 'faq' | 'gallery' | 'video' | 'payment_schedule' | 'interior' | 'video_showcase' | 'contact';
  layout: 'left' | 'right' | 'center' | 'full';
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;

  // Specific fields
  features?: { icon: string; title: string; description: string }[];
  agent?: { name: string; role: string; phone: string; email: string; avatarUrl: string };
  faq?: { question: string; answer: string }[];
  gallery?: string[];

  // Level 2 Fields
  paymentSchedule?: { stage: string; percentage: string; description: string; date?: string }[];
  interiorImages?: { url: string; roomName: string }[];
}

export interface LandingPage {
  id?: string;
  propertyId: string; // Foreign Key liên kết với Property
  slug: string;       // Định danh URL duy nhất
  isActive: boolean;

  // Cấu hình nội dung & giao diện
  heroTitle: string;
  heroSubtitle: string;
  themeColor: string;
  videoUrl?: string;
  locationMapUrl?: string;
  policy?: string;

  // Advanced Styling
  fontFamily?: 'font-sans' | 'font-serif' | 'font-mono';
  heroOverlayOpacity?: number; // 0-90
  ctaText?: string;

  // Menu Navigation
  menu?: { label: string; sectionId: string }[];

  sections?: LandingSection[]; // Danh sách các khối nội dung động

  // Metadata
  createdAt: any;
  updatedAt: any;
}