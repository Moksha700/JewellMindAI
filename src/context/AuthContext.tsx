import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRoleDoc } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: 'user' | 'admin' | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string, firstName: string, lastName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'jewelmind_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();
  
  // Track if listener is active
  const listenerInitialized = useRef(false);

  // Helper to fetch profile row from `profiles` table (keyed by auth user id)
  const fetchUserProfile = async (uid: string, fallbackEmail?: string): Promise<UserProfile | null> => {
    try {
      const profileRef = doc(db, 'profiles', uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: snap.id,
          email: data.email || fallbackEmail || '',
          firstName: data.firstName || 'Connoisseur',
          lastName: data.lastName || '',
          createdAt: data.createdAt ? String(data.createdAt) : undefined,
          updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
        };
      }
      return null;
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
      return null;
    }
  };

  // Helper to fetch user role from separate `user_roles` table
  const fetchUserRole = async (uid: string): Promise<'user' | 'admin'> => {
    try {
      const roleRef = doc(db, 'user_roles', uid);
      const snap = await getDoc(roleRef);
      if (snap.exists()) {
        return snap.data().role as 'user' | 'admin';
      }
      return 'user';
    } catch (err) {
      console.warn('Could not fetch user role, defaulting to user:', err);
      return 'user';
    }
  };

  // Requirement: "onAuthStateChange listener + initial getSession() — set listener FIRST, then read session"
  useEffect(() => {
    if (listenerInitialized.current) return;
    listenerInitialized.current = true;

    // 1. SET LISTENER FIRST
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Persist session to localStorage
        try {
          const sessionPayload = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            savedAt: Date.now(),
          };
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessionPayload));
        } catch (e) {
          console.warn('Could not persist session to localStorage', e);
        }

        // Fetch or initialize profile
        const prof = await fetchUserProfile(firebaseUser.uid, firebaseUser.email || '');
        if (prof) {
          setProfile(prof);
        } else {
          // If profile does not exist yet, generate default profile
          const initialProf: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || 'Jewellery Lover',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          };
          try {
            await setDoc(doc(db, 'profiles', firebaseUser.uid), {
              ...initialProf,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setProfile(initialProf);
          } catch (e) {
            console.error('Error auto-creating profile doc:', e);
            setProfile(initialProf);
          }
        }

        // Fetch separate role from user_roles
        const userRole = await fetchUserRole(firebaseUser.uid);
        setRole(userRole);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
      setLoading(false);
    });

    // 2. READ INITIAL SESSION / LOCAL STORAGE AFTER SETTING LISTENER
    const checkInitialSession = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (stored && !auth.currentUser) {
          // Session exists in storage; auth state listener will finalize the real token state
        }
      } catch (e) {
        console.warn('Error reading stored session', e);
      }
    };
    checkInitialSession();

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchUserProfile(user.uid, user.email || '');
      if (prof) setProfile(prof);
      const r = await fetchUserRole(user.uid);
      setRole(r);
    }
  };

  const signIn = async (email: string, pass: string): Promise<boolean> => {
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      showToast(`Welcome back, ${cred.user.email}!`, 'success');
      return true;
    } catch (err: any) {
      console.error('Sign in error:', err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        showToast('Invalid credentials. Please double check your email and password.', 'error');
      } else if (code === 'auth/too-many-requests') {
        showToast('Too many unsuccessful attempts. Please wait a moment and try again.', 'error');
      } else if (code === 'auth/invalid-email') {
        showToast('Please enter a valid email address.', 'error');
      } else {
        showToast(err?.message || 'Failed to sign in. Please try again.', 'error');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, firstName: string, lastName?: string): Promise<boolean> => {
    try {
      setLoading(true);
      // Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const uid = cred.user.uid;

      // Create profile row keyed by auth.users.id
      const newProfile: UserProfile = {
        id: uid,
        email: cred.user.email || email,
        firstName: firstName.trim() || 'Jewellery Connoisseur',
        lastName: lastName ? lastName.trim() : '',
      };

      try {
        await setDoc(doc(db, 'profiles', uid), {
          ...newProfile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (profErr) {
        handleFirestoreError(profErr, OperationType.CREATE, `profiles/${uid}`);
      }

      // Create separate user_roles row (never store role on profiles!)
      const newRole: UserRoleDoc = {
        userId: uid,
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'user_roles', uid), newRole);
      } catch (roleErr) {
        handleFirestoreError(roleErr, OperationType.CREATE, `user_roles/${uid}`);
      }

      setProfile(newProfile);
      setRole('user');
      showToast('Account created successfully! Welcome to JewelMind AI.', 'success');
      return true;
    } catch (err: any) {
      console.error('Sign up error:', err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        showToast('An account with this email already exists. Please sign in instead.', 'error');
      } else if (code === 'auth/weak-password') {
        showToast('Weak password. Please use at least 6 characters.', 'error');
      } else if (code === 'auth/invalid-email') {
        showToast('Please provide a valid email address.', 'error');
      } else {
        showToast(err?.message || 'Unable to complete signup. Please try again.', 'error');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      setUser(null);
      setProfile(null);
      setRole(null);
      showToast('You have been signed out successfully.', 'info');
    } catch (err) {
      console.error('Sign out error:', err);
      showToast('Error signing out.', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
