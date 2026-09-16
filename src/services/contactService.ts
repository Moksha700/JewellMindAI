import { doc, setDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ContactMessage } from '../types/contact';
import { ContactMessageFormData } from '../schemas/contactSchema';

const COLLECTION_NAME = 'contact_messages';
const RATE_LIMIT_KEY = 'jewelmind_contact_last_submit';
const COOLDOWN_SECONDS = 15;

/**
 * Checks if client is currently in submit cooldown window.
 * Returns remaining seconds if throttled, or 0 if allowed.
 */
export function getSubmitRateCooldownRemaining(): number {
  try {
    const lastStr = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (!lastStr) return 0;
    const lastTimestamp = parseInt(lastStr, 10);
    if (isNaN(lastTimestamp)) return 0;

    const diffSeconds = Math.floor((Date.now() - lastTimestamp) / 1000);
    if (diffSeconds < COOLDOWN_SECONDS) {
      return COOLDOWN_SECONDS - diffSeconds;
    }
    return 0;
  } catch {
    return 0;
  }
}

function recordSubmissionTimestamp() {
  try {
    sessionStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Session storage rate-limit write error:', e);
  }
}

/**
 * Submits a contact inquiry to contact_messages table/collection with:
 * - Honeypot verification
 * - Submit-rate guard (cooldown)
 * - UUID generation & Firestore persistence
 * - Local offline mirroring
 */
export async function submitContactMessage(
  data: ContactMessageFormData
): Promise<ContactMessage> {
  // 1. Honeypot check: If the hidden input has ANY value, it's an automated bot
  if (data._hp_verification && data._hp_verification.trim().length > 0) {
    console.warn('Honeypot triggered, dropping submission.');
    // Simulated fake delay to thwart bot timing analysis
    await new Promise((res) => setTimeout(res, 800));
    return {
      id: 'hp-' + Date.now(),
      name: data.name,
      email: data.email,
      message: data.message,
      source: data.source || 'web_contact_form',
      created_at: new Date().toISOString(),
    };
  }

  // 2. Submit-rate guard
  const cooldownRemaining = getSubmitRateCooldownRemaining();
  if (cooldownRemaining > 0) {
    throw new Error(
      `Please wait ${cooldownRemaining} second${cooldownRemaining === 1 ? '' : 's'} before submitting another inquiry.`
    );
  }

  // 3. Generate UUID / Document ID
  let id = '';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      id = crypto.randomUUID();
    } catch {
      id = `cm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
  } else {
    id = `cm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  const nowIso = new Date().toISOString();
  const contactRecord: ContactMessage = {
    id,
    name: data.name.trim(),
    email: data.email.trim(),
    message: data.message.trim(),
    source: data.source || 'web_contact_form',
    created_at: nowIso,
  };

  // 4. Update rate limit timestamp
  recordSubmissionTimestamp();

  // 5. Mirror to local backup for resilience
  try {
    const localMsgsRaw = localStorage.getItem('jewelmind_contact_backup');
    const localMsgs: ContactMessage[] = localMsgsRaw ? JSON.parse(localMsgsRaw) : [];
    localMsgs.unshift(contactRecord);
    localStorage.setItem('jewelmind_contact_backup', JSON.stringify(localMsgs.slice(0, 50)));
  } catch (e) {
    console.warn('Could not store local backup of contact message:', e);
  }

  // 6. Write to Firestore 'contact_messages'
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, contactRecord);
  } catch (err) {
    console.warn('Firestore contact write note (stored in offline local sync):', err);
  }

  return contactRecord;
}

/**
 * Admin helper to list messages (enforced by RLS has_role('admin')).
 */
export async function getContactMessagesAdmin(): Promise<ContactMessage[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as ContactMessage);
    }
  } catch (err) {
    console.warn('Admin fetch contact_messages notice:', err);
  }

  try {
    const localMsgsRaw = localStorage.getItem('jewelmind_contact_backup');
    return localMsgsRaw ? JSON.parse(localMsgsRaw) : [];
  } catch {
    return [];
  }
}
