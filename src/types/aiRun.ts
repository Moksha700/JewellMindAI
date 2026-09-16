export type AiCapability = 
  | 'language_understanding'
  | 'predictions_recommendations'
  | 'insights_dashboards'
  | 'vision_capabilities'
  | 'automation_logic';

export interface AiRunRecord {
  id: string;
  user_id: string;
  prompt: string;
  response: string;
  model: string;
  capability: AiCapability;
  status: 'completed' | 'success' | 'failed' | 'error';
  created_at: string;
}

export interface AiRunFilters {
  searchQuery: string;
  model: string;
  startDate?: string;
  endDate?: string;
}

export interface AiRunPayload {
  prompt: string;
  capability?: AiCapability;
  model?: string;
  imageUrl?: string;
  context?: Record<string, any>;
}
