import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  doc, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { JewelleryRecordDoc, RecordCategory, RecordStatus } from '../types';

const COLLECTION_NAME = 'jewellery_records';

function getActiveUserId(): string | null {
  if (auth.currentUser) return auth.currentUser.uid;
  try {
    const raw = localStorage.getItem('jewelmind_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.uid) return parsed.uid;
    }
  } catch {}
  return null;
}

function getLocalRecords(userId: string): JewelleryRecordDoc[] {
  try {
    const raw = localStorage.getItem(`jewelmind_records_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRecords(userId: string, records: JewelleryRecordDoc[]): void {
  try {
    localStorage.setItem(`jewelmind_records_${userId}`, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('jewelmind_records_changed', { detail: { userId } }));
  } catch (e) {
    console.warn('Failed to save local records', e);
  }
}

export async function fetchUserRecords(userId: string): Promise<JewelleryRecordDoc[]> {
  if (!auth.currentUser) {
    const local = getLocalRecords(userId);
    return local.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const records = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as JewelleryRecordDoc));
    if (records.length > 0) {
      saveLocalRecords(userId, records);
    }
    return records;
  } catch (error) {
    // If index is still building or composite order fails, fallback to simple where
    try {
      const fallbackQ = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
      );
      const snap = await getDocs(fallbackQ);
      const records = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as JewelleryRecordDoc));
      records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      if (records.length > 0) {
        saveLocalRecords(userId, records);
      }
      return records;
    } catch (fallbackErr) {
      console.warn('Firestore fetch unavailable, serving cached records:', fallbackErr);
      const local = getLocalRecords(userId);
      return local.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
  }
}

export function subscribeToUserRecords(
  userId: string,
  onUpdate: (records: JewelleryRecordDoc[]) => void,
  onError?: (err: unknown) => void
) {
  // Always provide initial local data immediately for instantaneous render
  onUpdate(getLocalRecords(userId));

  if (!auth.currentUser) {
    const handleStorageChange = (e: Event) => {
      const customEvt = e as CustomEvent<{ userId?: string }>;
      if (!customEvt.detail || customEvt.detail.userId === userId) {
        onUpdate(getLocalRecords(userId));
      }
    };
    window.addEventListener('jewelmind_records_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('jewelmind_records_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as JewelleryRecordDoc));
      // In-memory sort by date descending
      records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      if (records.length > 0) {
        saveLocalRecords(userId, records);
      }
      onUpdate(records);
    },
    (error) => {
      console.warn('Firestore snapshot notice (operating in offline fallback mode):', error);
      if (onError) onError(error);
      // Seamlessly supply cached local records during offline or unavailable states
      onUpdate(getLocalRecords(userId));
    }
  );
}

export async function createJewelleryRecord(record: {
  title: string;
  category: RecordCategory;
  occasion?: string;
  metalType?: string;
  gemstone?: string;
  notes?: string;
  status: RecordStatus;
  imageUrl?: string;
  priceEstimate?: string;
}): Promise<string> {
  const currentUid = getActiveUserId();
  if (!currentUid) throw new Error('User must be authenticated to create a record');

  const now = new Date().toISOString();
  // Generate valid ID
  const newId = 'rec_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);

  const payload: JewelleryRecordDoc = {
    id: newId,
    userId: currentUid,
    title: record.title.slice(0, 200),
    category: record.category,
    status: record.status,
    notes: (record.notes || '').slice(0, 2000),
    occasion: (record.occasion || '').slice(0, 100),
    metalType: (record.metalType || '').slice(0, 64),
    gemstone: (record.gemstone || '').slice(0, 64),
    imageUrl: record.imageUrl,
    priceEstimate: record.priceEstimate,
    createdAt: now,
    updatedAt: now,
  };

  // Optimistic local update ensures instantaneous response even if offline
  const existing = getLocalRecords(currentUid);
  saveLocalRecords(currentUid, [payload, ...existing.filter(r => r.id !== newId)]);

  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, newId);
      const { setDoc } = await import('firebase/firestore');
      await setDoc(docRef, payload);
    } catch (error) {
      console.warn('Firestore write queued for sync:', error);
    }
  }

  return newId;
}

export async function updateJewelleryRecordNotes(recordId: string, notes: string): Promise<void> {
  const currentUid = getActiveUserId();
  if (!currentUid) throw new Error('User must be authenticated to update record');

  // Optimistic local update
  const records = getLocalRecords(currentUid);
  const updated = records.map(r => r.id === recordId ? { ...r, notes: notes.slice(0, 2000), updatedAt: new Date().toISOString() } : r);
  saveLocalRecords(currentUid, updated);

  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, recordId);
      await updateDoc(docRef, {
        notes: notes.slice(0, 2000),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Firestore update queued for sync:', error);
    }
  }
}

export async function deleteJewelleryRecord(recordId: string): Promise<void> {
  const currentUid = getActiveUserId();
  if (!currentUid) throw new Error('User must be authenticated to delete record');

  // Optimistic local removal
  const records = getLocalRecords(currentUid);
  const filtered = records.filter(r => r.id !== recordId);
  saveLocalRecords(currentUid, filtered);

  if (auth.currentUser) {
    try {
      const docRef = doc(db, COLLECTION_NAME, recordId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firestore delete queued for sync:', error);
    }
  }
}
