import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { JewelleryRecordDoc, RecordCategory, RecordStatus } from '../types';

const COLLECTION_NAME = 'jewellery_records';

export async function fetchUserRecords(userId: string): Promise<JewelleryRecordDoc[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as JewelleryRecordDoc));
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
      return records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch (fallbackErr) {
      handleFirestoreError(fallbackErr, OperationType.LIST, COLLECTION_NAME);
    }
  }
}

export function subscribeToUserRecords(
  userId: string,
  onUpdate: (records: JewelleryRecordDoc[]) => void,
  onError?: (err: unknown) => void
) {
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
      onUpdate(records);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
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
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User must be authenticated to create a record');

  const now = new Date().toISOString();
  // Generate valid ID
  const newId = 'rec_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);

  const payload: JewelleryRecordDoc = {
    id: newId,
    userId: currentUser.uid,
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

  try {
    const docRef = doc(db, COLLECTION_NAME, newId);
    const { setDoc } = await import('firebase/firestore');
    await setDoc(docRef, payload);
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${newId}`);
  }
}

export async function updateJewelleryRecordNotes(recordId: string, notes: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User must be authenticated to update record');

  try {
    const docRef = doc(db, COLLECTION_NAME, recordId);
    await updateDoc(docRef, {
      notes: notes.slice(0, 2000),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${recordId}`);
  }
}

export async function deleteJewelleryRecord(recordId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User must be authenticated to delete record');

  try {
    const docRef = doc(db, COLLECTION_NAME, recordId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${recordId}`);
  }
}
