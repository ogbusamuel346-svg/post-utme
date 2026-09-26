export type ResourceCategory = 
  | 'all'
  | 'post_utme' 
  | 'jamb_utme' 
  | 'syllabus_novel' 
  | 'formula_sheet' 
  | 'bundle';

export interface SampleQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface Resource {
  id: string;
  slug: string;
  title: string;
  category: 'post_utme' | 'jamb_utme' | 'syllabus_novel' | 'formula_sheet' | 'bundle';
  institution?: string; // e.g. "UNILAG", "UI", "OAU", "JAMB General"
  subject?: string;
  yearRange: string;
  price: number; // in NGN
  isFree: boolean;
  coverUrl: string;
  mediaType?: 'document' | 'video';
  fileUrl?: string;
  fileSize: string;
  pageCount: number;
  duration?: string;
  format: string; // e.g. "PDF eBook"
  description: string;
  features: string[];
  downloadsCount: number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  sampleQuestions?: SampleQuestion[];
  createdAt: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
  lastChecked?: string;
}

export interface FilterState {
  search: string;
  category: ResourceCategory;
  institution: string;
  subject: string;
  priceFilter: 'all' | 'free' | 'paid';
  sortBy: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating';
}
