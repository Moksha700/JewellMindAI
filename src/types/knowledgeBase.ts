export type KnowledgeFileStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface KnowledgeDocumentChunk {
  id: string;
  chunkIndex: number;
  text: string;
  charCount: number;
}

export interface KnowledgeDocument {
  id: string;
  userId?: string;
  name: string;
  size: number;
  formattedSize: string;
  mimeType: string;
  extension: string; // 'pdf' | 'doc' | 'docx' | 'txt' | 'csv' | 'md' | 'json'
  displayType: string; // 'PDF Document', 'Word Document', 'CSV Spreadsheet', etc.
  status: KnowledgeFileStatus;
  errorMessage?: string;
  uploadedAt: string;
  textSnippet?: string;
  extractedText?: string;
  charCount: number;
  wordCount: number;
  chunkCount: number;
  chunks: KnowledgeDocumentChunk[];
  base64Data?: string; // stored for direct Gemini multimodal document pass-through
}

export interface KnowledgeBaseStats {
  totalDocuments: number;
  totalChunks: number;
  totalWords: number;
  totalSizeBytes: number;
  formattedTotalSize: string;
}

export interface KnowledgeSearchResult {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  chunkText: string;
  relevanceScore: number;
}
