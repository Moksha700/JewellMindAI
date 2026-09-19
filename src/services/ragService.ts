import { getKnowledgeDocuments } from './knowledgeBaseService';
import { streamAiRun } from './aiRunService';
import { KnowledgeSearchResult } from '../types/knowledgeBase';
import { AiCapability } from '../types/aiRun';

// Common English stopwords to ignore in keyword extraction
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'couldn', 'did', 'didn', 'do', 'does', 'doesn', 'doing', 'don', 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn', 'has', 'hasn', 'have', 'haven',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'isn', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'mustn', 'my', 'myself',
  'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan', 'she', 'should', 'shouldn', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'we', 'were',
  'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'won',
  'would', 'wouldn', 'you', 'your', 'yours', 'yourself', 'yourselves', 'tell', 'give', 'show', 'please'
]);

export interface RetrievalResult {
  chunks: KnowledgeSearchResult[];
  formattedContext: string;
  totalDocs: number;
  hasMatch: boolean;
  queryTerms: string[];
}

export interface RagQueryOptions {
  question: string;
  userId?: string;
  model?: string;
  capability?: AiCapability;
  maxChunks?: number;
  minScore?: number;
  onToken?: (token: string) => void;
  onError?: (error: { code: string; message: string }) => void;
  onComplete?: (answer: string, retrievedChunks: KnowledgeSearchResult[], grounded: boolean) => void;
}

export interface RagResponse {
  answer: string;
  retrievedChunks: KnowledgeSearchResult[];
  grounded: boolean;
}

/**
 * Normalizes text and extracts meaningful search tokens and n-grams.
 */
function extractQueryFeatures(query: string): { terms: string[]; phrases: string[] } {
  const clean = query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .trim();

  const rawTokens = clean.split(/\s+/).filter(Boolean);
  const terms: string[] = [];

  for (const token of rawTokens) {
    if (token.length >= 2 && !STOP_WORDS.has(token)) {
      terms.push(token);
    }
  }

  // Extract bi-grams (2-word phrases) for high-precision semantic matching
  const phrases: string[] = [];
  for (let i = 0; i < rawTokens.length - 1; i++) {
    const w1 = rawTokens[i];
    const w2 = rawTokens[i + 1];
    if (w1.length >= 2 && w2.length >= 2) {
      phrases.push(`${w1} ${w2}`);
    }
  }

  return { terms, phrases };
}

/**
 * Lightweight in-app RAG retrieval:
 * Searches across all uploaded knowledge document chunks using term frequencies,
 * exact phrase boosts, and title weighting.
 */
export async function retrieveKnowledgeContext(
  query: string,
  userId?: string,
  options: { maxChunks?: number; minScore?: number } = {}
): Promise<RetrievalResult> {
  const maxChunks = options.maxChunks ?? 4;
  const minScore = options.minScore ?? 0.08;

  const docs = await getKnowledgeDocuments(userId);
  const totalDocs = docs.length;

  if (!query.trim() || totalDocs === 0) {
    return {
      chunks: [],
      formattedContext: '',
      totalDocs,
      hasMatch: false,
      queryTerms: [],
    };
  }

  const { terms, phrases } = extractQueryFeatures(query);
  if (terms.length === 0 && phrases.length === 0) {
    // If the query was purely stopwords, fallback to non-empty tokens
    const rawTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    terms.push(...rawTokens);
  }

  const scoredChunks: KnowledgeSearchResult[] = [];

  for (const doc of docs) {
    if (!doc.chunks || doc.chunks.length === 0) continue;

    const docTitleLower = doc.name.toLowerCase();

    for (const chunk of doc.chunks) {
      const chunkLower = chunk.text.toLowerCase();
      let score = 0;
      let matchedTermsCount = 0;

      // 1. Term frequency scoring
      for (const term of terms) {
        if (chunkLower.includes(term)) {
          matchedTermsCount++;
          // Count occurrences in chunk
          const occurrences = (chunkLower.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
          score += 1.0 + (occurrences > 1 ? (occurrences - 1) * 0.4 : 0);
        }

        // Title match bonus
        if (docTitleLower.includes(term)) {
          score += 1.5;
        }
      }

      // 2. Exact phrase bonus (bigrams)
      for (const phrase of phrases) {
        if (chunkLower.includes(phrase)) {
          score += 2.5;
        }
      }

      if (score > 0 && matchedTermsCount > 0) {
        // Normalize score by number of query terms
        const normalizedScore = score / Math.max(terms.length, 1);

        if (normalizedScore >= minScore) {
          scoredChunks.push({
            documentId: doc.id,
            documentName: doc.name,
            chunkIndex: chunk.chunkIndex,
            chunkText: chunk.text,
            relevanceScore: Math.round(normalizedScore * 100) / 100,
          });
        }
      }
    }
  }

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const topChunks = scoredChunks.slice(0, maxChunks);

  // Format into clear context block for Gemini grounding
  const formattedContext = topChunks
    .map(
      (c, idx) =>
        `[Document #${idx + 1}: "${c.documentName}" (Section/Chunk ${c.chunkIndex}) - Relevance: ${c.relevanceScore}]\n${c.chunkText}`
    )
    .join('\n\n');

  return {
    chunks: topChunks,
    formattedContext,
    totalDocs,
    hasMatch: topChunks.length > 0,
    queryTerms: terms,
  };
}

/**
 * Reusable RAG Query Runner:
 * 1. Takes user question
 * 2. Searches & retrieves relevant chunks from Knowledge Base
 * 3. Passes retrieved context to Gemini via existing /api/ai-run edge service
 * 4. Generates an answer strictly grounded in that retrieved context
 * 5. If knowledge base does not have the answer, returns explicit "answer not found" message
 */
export async function askKnowledgeBaseRAG(options: RagQueryOptions): Promise<RagResponse> {
  const { question, userId, model, capability, onToken, onError, onComplete } = options;

  if (!question.trim()) {
    const emptyMsg = 'Please enter a question to consult your Knowledge Base.';
    onError?.({ code: 'EMPTY_QUERY', message: emptyMsg });
    return { answer: emptyMsg, retrievedChunks: [], grounded: false };
  }

  // Step 1: Retrieve relevant context from uploaded Knowledge Base
  const retrieval = await retrieveKnowledgeContext(question, userId, {
    maxChunks: options.maxChunks ?? 4,
    minScore: options.minScore ?? 0.08,
  });

  // Scenario A: No documents uploaded yet in Knowledge Base
  if (retrieval.totalDocs === 0) {
    const noDocsMsg =
      'The answer was not found in the uploaded knowledge base because no documents have been uploaded yet. Please upload your gemological guides, alloy manuals, or stone catalogs in the Knowledge Base first.';
    
    // Stream simulated message for smooth UI
    onToken?.(noDocsMsg);
    onComplete?.(noDocsMsg, [], false);
    return { answer: noDocsMsg, retrievedChunks: [], grounded: false };
  }

  // Scenario B: Documents exist, but no matching context found for this query
  if (!retrieval.hasMatch) {
    const notFoundMsg =
      'The answer was not found in the uploaded knowledge base. The uploaded documents do not contain information regarding this inquiry.';

    onToken?.(notFoundMsg);
    onComplete?.(notFoundMsg, [], false);
    return { answer: notFoundMsg, retrievedChunks: [], grounded: false };
  }

  // Scenario C: Relevant chunks found -> Ground Gemini in retrieved context
  return new Promise<RagResponse>((resolve) => {
    let accumulatedText = '';

    streamAiRun(
      {
        prompt: question.trim(),
        capability: capability || 'language_understanding',
        model: model || 'google/gemini-2.5-flash',
        context: {
          ragContext: retrieval.formattedContext,
          retrievedSources: retrieval.chunks.map((c) => ({
            documentId: c.documentId,
            documentName: c.documentName,
            chunkIndex: c.chunkIndex,
            relevanceScore: c.relevanceScore,
          })),
          isRag: true,
          question: question.trim(),
        },
      },
      {
        onToken: (token) => {
          accumulatedText += token;
          onToken?.(token);
        },
        onError: (err) => {
          onError?.(err);
          resolve({
            answer: accumulatedText || err.message,
            retrievedChunks: retrieval.chunks,
            grounded: false,
          });
        },
        onComplete: (fullResponse) => {
          const finalAnswer = fullResponse || accumulatedText;
          onComplete?.(finalAnswer, retrieval.chunks, true);
          resolve({
            answer: finalAnswer,
            retrievedChunks: retrieval.chunks,
            grounded: true,
          });
        },
      }
    );
  });
}
