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
