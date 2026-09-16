import { 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AiRunPayload, AiRunRecord, AiRunFilters } from '../types/aiRun';

const AI_RUNS_COLLECTION = 'ai_runs';

/**
 * Retrieves valid Bearer authorization token from current session.
 */
async function getAuthToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (e) {
    console.warn('Could not retrieve firebase id token:', e);
  }

  try {
    const raw = localStorage.getItem('jewelmind_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.uid) {
        // Return structured bearer token with user information
        return btoa(JSON.stringify({ uid: parsed.uid, email: parsed.email, sub: parsed.uid }));
      }
    }
  } catch (e) {
    console.warn('Could not read session token:', e);
  }

  return null;
}

export interface StreamAiRunCallbacks {
  onToken: (token: string) => void;
  onError: (error: { code: '401' | '402' | '429' | '500'; message: string }) => void;
  onComplete: (fullResponse: string, runRecord?: AiRunRecord) => void;
}

/**
 * Calls the /api/ai-run edge endpoint with streaming and renders token-by-token.
 * Handles rate limits (429) and insufficient credits (402).
 * Persists run to ai_runs table.
 */
export async function streamAiRun(
  payload: AiRunPayload,
  callbacks: StreamAiRunCallbacks
): Promise<void> {
  const token = await getAuthToken();

  if (!token) {
    callbacks.onError({
      code: '401',
      message: 'Authentication required. Please sign in to consult JewelMind AI.',
    });
    return;
  }

  try {
    const response = await fetch('/api/ai-run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: payload.prompt,
        capability: payload.capability || 'language_understanding',
        model: payload.model || 'google/gemini-2.5-flash',
        imageUrl: payload.imageUrl,
        context: payload.context,
      }),
    });

    if (response.status === 401) {
      callbacks.onError({
        code: '401',
        message: 'Session expired or invalid. Please sign in again.',
      });
      return;
    }

    if (response.status === 429) {
      callbacks.onError({
        code: '429',
        message: 'AI rate limit reached. Please wait a moment before trying again.',
      });
      return;
    }

    if (response.status === 402) {
      callbacks.onError({
        code: '402',
        message: 'AI credits exhausted. Please check your workspace balance or plan.',
      });
      return;
    }

    if (!response.ok && response.status !== 200) {
      let errText = 'An unexpected error occurred while communicating with the AI Gateway.';
      try {
        const errJson = await response.json();
        errText = errJson.message || errJson.error || errText;
      } catch {
        // use default
      }
      callbacks.onError({ code: '500', message: errText });
      return;
    }

    // Stream reader
    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError({ code: '500', message: 'Unable to initialize response stream reader.' });
      return;
    }

    const decoder = new TextDecoder();
    let accumulatedText = '';
    let runId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `run-${Date.now()}`;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('event: error')) {
          // Stream error event received
          continue;
        }

        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              if (parsed.status === 429 || parsed.error === 'rate_limit_exceeded') {
                callbacks.onError({
                  code: '429',
                  message: 'AI rate limit reached. Please wait a moment before trying again.',
                });
                return;
              }
              if (parsed.status === 402 || parsed.error === 'insufficient_credits') {
                callbacks.onError({
                  code: '402',
                  message: 'AI credits exhausted. Please check your workspace balance.',
                });
                return;
              }
              callbacks.onError({ code: '500', message: parsed.message || parsed.error });
              return;
            }

            const tokenPiece = parsed.choices?.[0]?.delta?.content || '';
            if (tokenPiece) {
              accumulatedText += tokenPiece;
              callbacks.onToken(tokenPiece);
            }
          } catch {
            // Raw text fallback if not JSON
            if (dataStr && !dataStr.startsWith('{')) {
              accumulatedText += dataStr;
              callbacks.onToken(dataStr);
            }
          }
        }
      }
    }

    // Persist to ai_runs table / Firestore scoped to owner
    const uid = auth.currentUser?.uid || 'user_current';
    const runRecord: AiRunRecord = {
      id: runId,
      user_id: uid,
      prompt: payload.prompt,
      response: accumulatedText,
      model: payload.model || 'google/gemini-2.5-flash',
      capability: payload.capability || 'language_understanding',
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, AI_RUNS_COLLECTION, runId);
      await setDoc(docRef, runRecord);
    } catch (err) {
      console.warn('Firestore ai_runs storage notice (caching locally):', err);
    }

    // Mirror in localStorage for fast instant lookup
    try {
      const localKey = `jewelmind_ai_runs_${uid}`;
      const existingRaw = localStorage.getItem(localKey);
      const existing: AiRunRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(runRecord);
      localStorage.setItem(localKey, JSON.stringify(existing.slice(0, 100)));
    } catch (e) {
      console.warn('Local storage ai_runs caching notice:', e);
    }

    callbacks.onComplete(accumulatedText, runRecord);
  } catch (error: any) {
    callbacks.onError({
      code: '500',
      message: error?.message || 'Failed to connect to the AI Gateway.',
    });
  }
}

/**
 * Interface for infinite pagination page result
 */
export interface FetchAiRunsPageResult {
  items: AiRunRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  totalLoaded: number;
}

export interface FetchAiRunsPageParams {
  userId: string;
  cursor?: string | null;
  pageSize?: number;
  searchQuery?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Paginated query for user's AI runs with TanStack Query infinite scroll support (Page size: 25).
 * Queries Firestore indexed by (user_id, created_at desc) with fallback to local mirror.
 */
export async function fetchUserAiRunsPage({
  userId,
  cursor = null,
  pageSize = 25,
  searchQuery = '',
  model = '',
  startDate = '',
  endDate = '',
}: FetchAiRunsPageParams): Promise<FetchAiRunsPageResult> {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();

  let allLoaded: AiRunRecord[] = [];
  let nextDocId: string | null = null;

  try {
    // 1. Query Firestore indexed on (user_id, created_at desc)
    let q = query(
      collection(db, AI_RUNS_COLLECTION),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(pageSize * 3) // fetch enough records to allow in-memory filtering by substring/model/date
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      allLoaded = snap.docs.map((d) => {
        const data = d.data() as AiRunRecord;
        return {
          ...data,
          status: data.status || 'completed',
        };
      });
    }
  } catch (err) {
    console.warn('Firestore fetchUserAiRunsPage query notice:', err);
  }

  // Fallback to local storage mirror if Firestore returned empty or failed
  if (allLoaded.length === 0) {
    try {
      const localKey = `jewelmind_ai_runs_${userId}`;
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const localList: AiRunRecord[] = JSON.parse(raw);
        allLoaded = localList.map((item) => ({
          ...item,
          status: item.status || 'completed',
        }));
      }
    } catch (e) {
      console.warn('Local mirror load error:', e);
    }
  }

  // Apply filters:
  let filtered = allLoaded.filter((record) => {
    // Substring search on prompt or response
    if (normalizedSearch) {
      const matchPrompt = record.prompt?.toLowerCase().includes(normalizedSearch);
      const matchResponse = record.response?.toLowerCase().includes(normalizedSearch);
      if (!matchPrompt && !matchResponse) return false;
    }

    // Filter by model
    if (normalizedModel && normalizedModel !== 'all') {
      const recordModel = (record.model || '').toLowerCase();
      if (!recordModel.includes(normalizedModel)) return false;
    }

    // Date range filter
    if (startDate) {
      const startMs = new Date(startDate).getTime();
      const recordMs = new Date(record.created_at).getTime();
      if (!isNaN(startMs) && !isNaN(recordMs) && recordMs < startMs) return false;
    }

    if (endDate) {
      // Include the entire end date (up to 23:59:59)
      const endObj = new Date(endDate);
      endObj.setHours(23, 59, 59, 999);
      const endMs = endObj.getTime();
      const recordMs = new Date(record.created_at).getTime();
      if (!isNaN(endMs) && !isNaN(recordMs) && recordMs > endMs) return false;
    }

    return true;
  });

  // Handle cursor pagination
  let startIndex = 0;
  if (cursor) {
    const foundIndex = filtered.findIndex((item) => item.id === cursor);
    if (foundIndex !== -1) {
      startIndex = foundIndex + 1;
    }
  }

  const pagedItems = filtered.slice(startIndex, startIndex + pageSize);
  const nextItem = filtered[startIndex + pageSize];
  const hasMore = Boolean(nextItem);
  const nextCursor = hasMore && nextItem ? nextItem.id : null;

  return {
    items: pagedItems,
    nextCursor,
    hasMore,
    totalLoaded: filtered.length,
  };
}

/**
 * Fetches previous AI runs for the current user.
 */
export async function fetchUserAiRuns(userId: string): Promise<AiRunRecord[]> {
  const result = await fetchUserAiRunsPage({ userId, pageSize: 50 });
  return result.items;
}
