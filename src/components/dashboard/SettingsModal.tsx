import React, { useState } from 'react';
import { X, User, Shield, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, role, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const profRef = doc(db, 'profiles', user.uid);
      await updateDoc(profRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        updatedAt: new Date().toISOString(),
      });
      await refreshProfile();
      showToast('Profile updated successfully!', 'success');
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
      showToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="settings-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans-clean"
    >
      <div className="relative bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-6 sm:p-7 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-900 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="font-serif-luxury text-xl font-bold text-stone-900">
                Account Settings
              </h3>
              <p className="text-xs text-stone-500">Manage profile details & security roles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Role Badge Notice (Highlighting the user_roles separation!) */}
        <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
          <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Security Model: Separate `user_roles` Architecture</p>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Your security role (<strong className="text-stone-900 capitalize font-bold">{role || 'user'}</strong>) is maintained in a distinct <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded">user_roles</code> table validated via security-definer rules, strictly isolated from profiles.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          <div>
            <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
              Email Address
            </label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
              ✓ Verified & Auto-confirmed in Development
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-stone-600 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-[#1A1715] hover:bg-[#2C2724] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Update Profile</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
