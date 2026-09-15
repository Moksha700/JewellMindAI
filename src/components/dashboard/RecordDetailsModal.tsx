import React, { useState } from 'react';
import { X, Trash2, Edit3, Check, Loader2, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { JewelleryRecordDoc } from '../../types';
import { updateJewelleryRecordNotes, deleteJewelleryRecord } from '../../services/recordsService';
import { useToast } from '../../context/ToastContext';

interface RecordDetailsModalProps {
  record: JewelleryRecordDoc | null;
  onClose: () => void;
  onRecordUpdated: () => void;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({
  record,
  onClose,
  onRecordUpdated,
}) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(record?.notes || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  if (!record) return null;

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await updateJewelleryRecordNotes(record.id, notes);
      showToast('Notes updated successfully!', 'success');
      setEditingNotes(false);
      onRecordUpdated();
    } catch (err) {
      showToast('Failed to update notes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this record from your vault?')) return;
    setDeleting(true);
    try {
      await deleteJewelleryRecord(record.id);
      showToast('Record removed.', 'info');
      onRecordUpdated();
      onClose();
    } catch (err) {
      showToast('Failed to delete record.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans-clean"
    >
      <div className="relative bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl p-6 sm:p-7 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {record.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close record details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record Overview */}
        <div className="flex flex-col sm:flex-row gap-5 items-center">
          {record.imageUrl && (
            <img
              src={record.imageUrl}
              alt={record.title}
              className="w-32 h-32 rounded-2xl object-cover border border-stone-200 shrink-0"
            />
          )}
          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <h3 className="font-serif-luxury text-2xl font-bold text-stone-900 leading-snug">
              {record.title}
            </h3>
            <div className="flex flex-wrap gap-2 text-xs pt-1 justify-center sm:justify-start">
              {record.metalType && (
                <span className="bg-stone-100 px-2 py-0.5 rounded-md text-stone-700 font-medium">
                  {record.metalType}
                </span>
              )}
              {record.gemstone && (
                <span className="bg-stone-100 px-2 py-0.5 rounded-md text-stone-700 font-medium">
                  {record.gemstone}
                </span>
              )}
              {record.priceEstimate && (
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                  {record.priceEstimate}
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 flex items-center gap-1 pt-1 justify-center sm:justify-start">
              <Calendar className="w-3 h-3" />
              <span>Created {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'recently'}</span>
            </p>
          </div>
        </div>

        {/* Notes & Insights Section */}
        <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
              AI Styling Notes & Specifications
            </span>
            {!editingNotes && (
              <button
                type="button"
                onClick={() => {
                  setNotes(record.notes || '');
                  setEditingNotes(true);
                }}
                className="text-stone-500 hover:text-amber-800 flex items-center gap-1 font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Notes</span>
              </button>
            )}
          </div>

          {editingNotes ? (
            <div className="space-y-2 pt-1">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="py-1.5 px-3 bg-[#1A1715] text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  <span>Save Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNotes(false)}
                  className="py-1.5 px-3 bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">
              {record.notes || 'No custom notes recorded.'}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-rose-50 transition-colors"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Delete from Vault</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
