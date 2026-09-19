import { KnowledgeSearchResult } from './knowledgeBase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: KnowledgeSearchResult[];
  grounded?: boolean;
}
