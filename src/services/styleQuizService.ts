import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  StyleQuizItem, 
  StyleQuizFilterOptions, 
  PaginatedResult, 
  StyleQuizStatus 
} from '../types/styleQuiz';
import { StyleQuizFormData } from '../schemas/styleQuizSchema';

const COLLECTION_NAME = 'style_quiz';
const LOCAL_STORAGE_KEY_PREFIX = 'jewelmind_style_quiz_';

function getLocalQuizzes(userId: string): StyleQuizItem[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) {
      // Provide some initial seed style quiz items if empty
      const initialSeed: StyleQuizItem[] = [
        {
          id: 'sq-seed-1',
          userId: userId,
          user_id: userId,
          title: 'Art Deco Royal Engagement Set',
          payload: {
            metalPreference: 'Platinum / White Gold',
            primaryGemstone: 'Diamond',
            aestheticStyle: 'Art Deco Vintage',
            budgetRange: '$5,000 - $10,000',
            occasionType: 'Wedding & Engagement',
            notes: 'Looking for geometric stepped halos and filigree milgrain detailing on the band.'
          },
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'sq-seed-2',
          userId: userId,
          user_id: userId,
          title: 'Gala Evening High-Jewellery Emeralds',
          payload: {
            metalPreference: '18k Yellow Gold',
            primaryGemstone: 'Colombian Emerald',
            aestheticStyle: 'Royal Classic Heritage',
            budgetRange: '$10,000+',
            occasionType: 'Black Tie Gala',
            notes: 'Seeking deep vivid green saturation paired with pear-cut diamond side stones.'
          },
          status: 'draft',
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        }
      ];
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(initialSeed));
      return initialSeed;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalQuizzes(userId: string, items: StyleQuizItem[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save to local cache:', e);
  }
}

/**
 * Lists all Style Quiz items for current user, filtered by user_id = auth.uid().
 * Supports search, status filtering, client-side pagination, and offline resilience.
 */
export async function listStyleQuizzes(
  userId: string,
  options: StyleQuizFilterOptions = {}
): Promise<PaginatedResult<StyleQuizItem>> {
  const { search = '', status = 'all', page = 1, pageSize = 6 } = options;

  let allItems: StyleQuizItem[] = [];

  try {
    // Strictly filter by user_id = auth.uid() matching RLS rules
    const quizRef = collection(db, COLLECTION_NAME);
    const q = query(quizRef, where('user_id', '==', userId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      allItems = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId || data.user_id || userId,
          user_id: data.user_id || data.userId || userId,
          title: data.title || 'Untitled Quiz',
          payload: data.payload || {},
          status: (data.status as StyleQuizStatus) || 'draft',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      });

      // Synchronize with local storage
      saveLocalQuizzes(userId, allItems);
    } else {
      // If Firestore returned 0 docs, use local fallback cache
      allItems = getLocalQuizzes(userId);
    }
  } catch (err) {
    console.warn('Firestore fetch query notice, serving local cached quizzes:', err);
    allItems = getLocalQuizzes(userId);
  }

  // Filter in memory for instantaneous search & status
  let filtered = allItems;

  if (status !== 'all') {
    filtered = filtered.filter((item) => item.status === status);
  }

  if (search.trim()) {
    const qLower = search.toLowerCase().trim();
    filtered = filtered.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(qLower);
      const metalMatch = item.payload.metalPreference?.toLowerCase().includes(qLower);
      const gemMatch = item.payload.primaryGemstone?.toLowerCase().includes(qLower);
      const styleMatch = item.payload.aestheticStyle?.toLowerCase().includes(qLower);
      const occasionMatch = item.payload.occasionType?.toLowerCase().includes(qLower);
      const notesMatch = item.payload.notes?.toLowerCase().includes(qLower);
      return titleMatch || metalMatch || gemMatch || styleMatch || occasionMatch || notesMatch;
    });
  }

  // Sort descending by updatedAt / createdAt
  filtered.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedData,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

/**
 * Fetches a single Style Quiz item by id, verifying user_id = auth.uid().
 */
export async function getStyleQuizById(
  id: string,
  userId: string
): Promise<StyleQuizItem | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      // Enforce owner check
      if (data.user_id !== userId && data.userId !== userId) {
        throw new Error('Unauthorized: You do not own this Style Quiz');
      }
      return {
        id: snap.id,
        userId: data.userId || data.user_id || userId,
        user_id: data.user_id || data.userId || userId,
        title: data.title || 'Untitled Quiz',
        payload: data.payload || {},
        status: (data.status as StyleQuizStatus) || 'draft',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Firestore get single doc notice, checking local cache:', err);
  }

  // Check local cache
  const localItems = getLocalQuizzes(userId);
  const found = localItems.find((i) => i.id === id);
  return found || null;
}

/**
 * Creates a new Style Quiz item.
 */
export async function createStyleQuiz(
  userId: string,
  formData: StyleQuizFormData
): Promise<StyleQuizItem> {
  const newId = `sq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newItem: StyleQuizItem = {
    id: newId,
    userId: userId,
    user_id: userId,
    title: formData.title,
    payload: {
      metalPreference: formData.metalPreference,
      primaryGemstone: formData.primaryGemstone,
      aestheticStyle: formData.aestheticStyle,
      budgetRange: formData.budgetRange,
      occasionType: formData.occasionType,
      notes: formData.notes || '',
    },
    status: formData.status,
    createdAt: now,
    updatedAt: now,
  };

  // Optimistic local update
  const local = getLocalQuizzes(userId);
  saveLocalQuizzes(userId, [newItem, ...local]);

  // Push to Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, newId);
    await setDoc(docRef, newItem);
  } catch (err) {
    console.warn('Firestore write queued or handled in offline cache:', err);
  }

  return newItem;
}

/**
 * Updates an existing Style Quiz item.
 */
export async function updateStyleQuiz(
  id: string,
  userId: string,
  formData: StyleQuizFormData
): Promise<StyleQuizItem> {
  const now = new Date().toISOString();

  const local = getLocalQuizzes(userId);
  const existing = local.find((i) => i.id === id);

  const updatedItem: StyleQuizItem = {
    id,
    userId: userId,
    user_id: userId,
    title: formData.title,
    payload: {
      metalPreference: formData.metalPreference,
      primaryGemstone: formData.primaryGemstone,
      aestheticStyle: formData.aestheticStyle,
      budgetRange: formData.budgetRange,
      occasionType: formData.occasionType,
      notes: formData.notes || '',
    },
    status: formData.status,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  // Update local
  const newLocal = local.map((i) => (i.id === id ? updatedItem : i));
  saveLocalQuizzes(userId, newLocal);

  // Update Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      title: updatedItem.title,
      payload: updatedItem.payload,
      status: updatedItem.status,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Firestore update queued:', err);
  }

  return updatedItem;
}

/**
 * Toggles status (e.g., 'draft' <-> 'completed' <-> 'archived')
 */
export async function toggleStyleQuizStatus(
  id: string,
  userId: string,
  newStatus: StyleQuizStatus
): Promise<StyleQuizItem> {
  const now = new Date().toISOString();
  const local = getLocalQuizzes(userId);
  const item = local.find((i) => i.id === id);
  if (!item) throw new Error('Quiz not found');

  const updatedItem: StyleQuizItem = {
    ...item,
    status: newStatus,
    updatedAt: now,
  };

  saveLocalQuizzes(userId, local.map((i) => (i.id === id ? updatedItem : i)));

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Firestore status toggle queued:', err);
  }

  return updatedItem;
}

/**
 * Deletes a Style Quiz item.
 */
export async function deleteStyleQuiz(id: string, userId: string): Promise<void> {
  // Remove from local cache
  const local = getLocalQuizzes(userId);
  saveLocalQuizzes(
    userId,
    local.filter((i) => i.id !== id)
  );

  // Delete from Firestore
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete queued:', err);
  }
}
