export type StyleQuizStatus = 'draft' | 'completed' | 'archived';

export interface StyleQuizPayload {
  metalPreference: string;
  primaryGemstone: string;
  aestheticStyle: string;
  budgetRange: string;
  occasionType: string;
  ringSize?: string;
  chainLength?: string;
  notes?: string;
  aiSuggestedKeywords?: string[];
}

export interface StyleQuizItem {
  id: string;
  userId: string;
  user_id: string;
  title: string;
  payload: StyleQuizPayload;
  status: StyleQuizStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StyleQuizFilterOptions {
  search?: string;
  status?: 'all' | StyleQuizStatus;
  sortBy?: 'createdAt' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
