export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRoleDoc {
  userId: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export type RecordCategory = 
  | 'Style Quiz' 
  | 'Occasion Match' 
  | 'Virtual Try-On' 
  | 'Recommendation Engine' 
  | 'Saved Favorites';

export type RecordStatus = 'saved' | 'completed' | 'draft';

export interface JewelleryRecordDoc {
  id: string;
  userId: string;
  title: string;
  category: RecordCategory;
  occasion?: string;
  metalType?: string;
  gemstone?: string;
  notes?: string;
  status: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  priceEstimate?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface JewelleryCatalogItem {
  id: string;
  name: string;
  category: 'Necklace' | 'Ring' | 'Earrings' | 'Bracelet';
  metal: '18k Yellow Gold' | 'Platinum / White Gold' | '18k Rose Gold';
  gemstone: 'Diamond' | 'Emerald' | 'Sapphire' | 'Pearl' | 'Ruby' | 'Moissanite';
  price: number;
  occasion: string[];
  style: 'Art Deco' | 'Modern Minimalist' | 'Royal Classic' | 'Vintage Romance' | 'Contemporary Statement';
  description: string;
  imageUrl: string;
  tryOnType: 'neck' | 'finger' | 'ear' | 'wrist';
}

// ============================================================================
// Cloud Database Entity Types (matching public schema tables)
// ============================================================================

export type AppRole = 'admin' | 'user';

export interface DbProfile {
  id: string; // uuid -> auth.users
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUserRole {
  id: string; // uuid
  user_id: string; // uuid -> auth.users
  role: AppRole;
  created_at: string;
}

export interface DbStyleQuiz {
  id: string; // uuid
  user_id: string; // uuid -> auth.users
  title: string;
  payload: Record<string, any>;
  status: 'draft' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface DbOccasionFilter {
  id: string; // uuid
  user_id: string; // uuid -> auth.users
  occasion_name: string;
  dress_code?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  metal_preferences: string[];
  gemstone_preferences: string[];
  payload: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbVirtualTryOn {
  id: string; // uuid
  user_id: string; // uuid -> auth.users
  item_name: string;
  category: string;
  try_on_type: 'neck' | 'finger' | 'ear' | 'wrist';
  source_image_url?: string | null;
  rendered_image_url?: string | null;
  calibration_data: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbRecommendationEngine {
  id: string; // uuid
  user_id: string; // uuid -> auth.users
  title: string;
  jewellery_item_id?: string | null;
  category: string;
  match_score?: number | null;
  ai_reasoning?: string | null;
  attributes: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbSavedFavorite {
  id: string; // uuid
  user_id: string; // uuid -> auth.users
  item_id: string;
  item_title: string;
  category: string;
  metal_type?: string | null;
  gemstone?: string | null;
  price_estimate?: number | null;
  image_url?: string | null;
  notes?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

