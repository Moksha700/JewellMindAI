import { 
  KnowledgeDocument, 
  KnowledgeDocumentChunk, 
  KnowledgeBaseStats, 
  KnowledgeSearchResult 
} from '../types/knowledgeBase';

const DB_NAME = 'JewelMind_KnowledgeBase_DB';
const DB_VERSION = 1;
const STORE_NAME = 'knowledge_documents';
const LOCAL_STORAGE_FALLBACK_KEY = 'jewelmind_knowledge_documents_meta';

// Helper: Open or create IndexedDB with safety timeout
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const timer = setTimeout(() => {
      reject(new Error('IndexedDB open operation timed out'));
    }, 1500);

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        clearTimeout(timer);
        resolve(request.result);
      };
      request.onerror = () => {
        clearTimeout(timer);
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
      request.onblocked = () => {
        clearTimeout(timer);
        reject(new Error('IndexedDB open blocked'));
      };
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

// Helper: Format byte size
export function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Helper: Detect file extension and human-readable type
export function getDocumentDisplayMeta(filename: string, mimeType: string): { extension: string; displayType: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  let displayType = 'Document';
  if (ext === 'pdf' || mimeType.includes('pdf')) {
    displayType = 'PDF Document';
  } else if (ext === 'doc' || ext === 'docx' || mimeType.includes('word') || mimeType.includes('officedocument')) {
    displayType = 'Word Document';
  } else if (ext === 'csv' || mimeType.includes('csv')) {
    displayType = 'CSV Spreadsheet';
  } else if (ext === 'txt' || mimeType.includes('plain')) {
    displayType = 'Plain Text';
  } else if (ext === 'md') {
    displayType = 'Markdown Document';
  } else if (ext === 'json' || mimeType.includes('json')) {
    displayType = 'JSON Data';
  }

  return { extension: ext, displayType };
}

// Helper: Extract text from file and prepare base64
async function extractFileTextAndBase64(file: File): Promise<{ text: string; base64?: string }> {
  const { extension } = getDocumentDisplayMeta(file.name, file.type);

  // 1. Plain text formats: read directly as text
  if (['txt', 'csv', 'md', 'json'].includes(extension) || file.type.startsWith('text/')) {
    try {
      const text = await file.text();
      return { text };
    } catch {
      // Fallback below
    }
  }

  // 2. Read ArrayBuffer for binary files (PDF, DOC, DOCX)
  const arrayBuffer = await file.arrayBuffer();
  
  // Convert arrayBuffer to base64
  let base64 = '';
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    base64 = btoa(binary);
  } catch (err) {
    console.warn('Could not encode base64 for file:', file.name, err);
  }

  // Extract readable text from PDF or DOCX binary stream
  let extractedText = '';
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = decoder.decode(arrayBuffer);

    if (extension === 'pdf') {
      // Extract textual streams enclosed in BT / ET or text objects
      const streamRegex = /BT[\s\S]*?ET/g;
      const matches = rawString.match(streamRegex);
      if (matches && matches.length > 0) {
        const textParts = matches.map((block) => {
          // Extract text inside parentheses (e.g. (Hello World) Tj)
          const textMatches = block.match(/\((.*?)\)/g);
          if (textMatches) {
            return textMatches.map((m) => m.slice(1, -1)).join(' ');
          }
          return '';
        }).filter(Boolean);

        if (textParts.length > 0) {
          extractedText = textParts.join('\n');
        }
      }

      // If text stream parsing was sparse, supplement with printable ASCII sequences
      if (extractedText.length < 50) {
        const readableStrings = rawString.match(/[A-Za-z0-9\s,.:;!?'"()\-–—]{4,}/g) || [];
        extractedText = readableStrings
          .filter((s) => !s.startsWith('/Filter') && !s.startsWith('/Length') && !s.startsWith('/Type'))
          .slice(0, 150)
          .join(' ')
          .trim();
      }
    } else if (extension === 'docx') {
      // DOCX contains XML with <w:t> tags
      const wtMatches = rawString.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
      if (wtMatches && wtMatches.length > 0) {
        extractedText = wtMatches
          .map((tag) => tag.replace(/<[^>]+>/g, ''))
          .join(' ');
      } else {
        // Fallback to printable text strings
        const readableStrings = rawString.match(/[A-Za-z0-9\s,.:;!?'"()\-–—]{4,}/g) || [];
        extractedText = readableStrings.slice(0, 150).join(' ').trim();
      }
    } else {
      // General document fallback
      const readableStrings = rawString.match(/[A-Za-z0-9\s,.:;!?'"()\-–—]{4,}/g) || [];
      extractedText = readableStrings.slice(0, 150).join(' ').trim();
    }
  } catch (err) {
    console.warn('Text extraction fallback warning:', err);
  }

  // If no text was parsed, provide an informative descriptor
  if (!extractedText.trim()) {
    extractedText = `[${file.name} - ${extension.toUpperCase()} document: ${formatBytes(file.size)}. Ready for Gemini multimodal processing]`;
  }

  return { text: extractedText, base64 };
}

// Helper: Split text into RAG-ready semantic chunks (~500 chars with 80 chars overlap)
export function chunkText(text: string, chunkSize = 500, overlap = 80): KnowledgeDocumentChunk[] {
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const chunks: KnowledgeDocumentChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 1;

  while (startIndex < clean.length) {
    let endIndex = startIndex + chunkSize;
    
    // If not at the end of text, attempt to break at a newline or period
    if (endIndex < clean.length) {
      const slice = clean.slice(startIndex, endIndex + 50);
      const breakPoints = [
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf('; '),
      ];
      const validBreak = Math.max(...breakPoints);
      if (validBreak > chunkSize * 0.5) {
        endIndex = startIndex + validBreak + 1;
      }
    }

    const chunkContent = clean.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        id: `chunk_${chunkIndex}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chunkIndex,
        text: chunkContent,
        charCount: chunkContent.length,
      });
      chunkIndex++;
    }

    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

// ============================================================================
// Core Database Operations (IndexedDB + localStorage Fallback)
// ============================================================================

export async function getKnowledgeDocuments(userId?: string): Promise<KnowledgeDocument[]> {
  try {
    const db = await openIndexedDB();
    return await new Promise<KnowledgeDocument[]>((resolve) => {
      const timer = setTimeout(() => {
        resolve(getFallbackLocalStorageDocs(userId));
      }, 1500);

      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          clearTimeout(timer);
          let results = (request.result as KnowledgeDocument[]) || [];
          if (userId) {
            results = results.filter((doc) => !doc.userId || doc.userId === userId);
          }
          // Sort newest first
          results.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          resolve(results);
        };

        request.onerror = () => {
          clearTimeout(timer);
          resolve(getFallbackLocalStorageDocs(userId));
        };
      } catch {
        clearTimeout(timer);
        resolve(getFallbackLocalStorageDocs(userId));
      }
    });
  } catch {
    return getFallbackLocalStorageDocs(userId);
  }
}

function getFallbackLocalStorageDocs(userId?: string): KnowledgeDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    if (!raw) return [];
    let items: KnowledgeDocument[] = JSON.parse(raw);
    if (userId) {
      items = items.filter((d) => !d.userId || d.userId === userId);
    }
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return items;
  } catch {
    return [];
  }
}

function saveFallbackLocalStorageDocs(docs: KnowledgeDocument[]) {
  try {
    // Strip heavy base64 for localStorage quota safety
    const light = docs.map((d) => ({
      ...d,
      base64Data: undefined,
    }));
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(light));
  } catch (e) {
    console.warn('LocalStorage save fallback quota exceeded or unavailable:', e);
  }
}

export async function processAndSaveKnowledgeFile(
  file: File, 
  userId?: string
): Promise<KnowledgeDocument> {
  const docId = `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { extension, displayType } = getDocumentDisplayMeta(file.name, file.type);
  
  // Step 1: Extract text and base64
  const { text, base64 } = await extractFileTextAndBase64(file);
  
  // Step 2: Generate semantic RAG chunks
  const chunks = chunkText(text);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const textSnippet = text.slice(0, 240).replace(/\s+/g, ' ').trim() + (text.length > 240 ? '...' : '');

  const newDoc: KnowledgeDocument = {
    id: docId,
    userId,
    name: file.name,
    size: file.size,
    formattedSize: formatBytes(file.size),
    mimeType: file.type || 'application/octet-stream',
    extension,
    displayType,
    status: 'ready',
    uploadedAt: new Date().toISOString(),
    textSnippet,
    extractedText: text,
    charCount: text.length,
    wordCount,
    chunkCount: chunks.length,
    chunks,
    base64Data: base64,
  };

  // Step 3: Persist to IndexedDB
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(newDoc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (idbErr) {
    console.warn('IndexedDB write failed, relying on localStorage fallback:', idbErr);
  }

  // Sync to fallback localStorage
  const existing = getFallbackLocalStorageDocs(userId);
  const updated = [newDoc, ...existing.filter((d) => d.id !== newDoc.id)];
  saveFallbackLocalStorageDocs(updated);

  return newDoc;
}

export async function deleteKnowledgeDocument(id: string): Promise<boolean> {
  let success = false;
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => {
        success = true;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Continue to remove from fallback
  }

  const existing = getFallbackLocalStorageDocs();
  const filtered = existing.filter((d) => d.id !== id);
  saveFallbackLocalStorageDocs(filtered);

  return true;
}

export async function getKnowledgeBaseStats(userId?: string): Promise<KnowledgeBaseStats> {
  const docs = await getKnowledgeDocuments(userId);
  const totalDocuments = docs.length;
  let totalChunks = 0;
  let totalWords = 0;
  let totalSizeBytes = 0;

  for (const doc of docs) {
    totalChunks += doc.chunkCount || doc.chunks?.length || 0;
    totalWords += doc.wordCount || 0;
    totalSizeBytes += doc.size || 0;
  }

  return {
    totalDocuments,
    totalChunks,
    totalWords,
    totalSizeBytes,
    formattedTotalSize: formatBytes(totalSizeBytes),
  };
}

// RAG Search Helper: keyword and semantic overlap retrieval across all chunks
export async function searchKnowledgeBase(query: string, limit = 5): Promise<KnowledgeSearchResult[]> {
  const docs = await getKnowledgeDocuments();
  if (!query.trim() || docs.length === 0) return [];

  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const results: KnowledgeSearchResult[] = [];

  for (const doc of docs) {
    if (!doc.chunks || doc.chunks.length === 0) continue;

    for (const chunk of doc.chunks) {
      const chunkLower = chunk.text.toLowerCase();
      let matchCount = 0;

      for (const term of queryTerms) {
        if (chunkLower.includes(term)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        // Simple TF relevance scoring
        const score = matchCount / queryTerms.length;
        results.push({
          documentId: doc.id,
          documentName: doc.name,
          chunkIndex: chunk.chunkIndex,
          chunkText: chunk.text,
          relevanceScore: score,
        });
      }
    }
  }

  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}
