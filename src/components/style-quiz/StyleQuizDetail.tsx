import React, { useState } from 'react';
import { StyleQuizItem, StyleQuizStatus } from '../../types/styleQuiz';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Gem, 
  Sliders, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Archive, 
  FileText,
  Copy,
  Check
} from 'lucide-react';

interface StyleQuizDetailProps {
  quiz: StyleQuizItem;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void> | void;
  onToggleStatus: (id: string, newStatus: StyleQuizStatus) => void;
  isDeleting: boolean;
}

export const StyleQuizDetail: React.FC<StyleQuizDetailProps> = ({
  quiz,
  onBack,
  onEdit,
  onDelete,
  onToggleStatus,
  isDeleting,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = `JewelMind AI Style Quiz: ${quiz.title}\nMetal: ${quiz.payload.metalPreference}\nGemstone: ${quiz.payload.primaryGemstone}\nStyle: ${quiz.payload.aestheticStyle}\nBudget: ${quiz.payload.budgetRange}\nOccasion: ${quiz.payload.occasionType}\nNotes: ${quiz.payload.notes || 'None'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: StyleQuizStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <Archive className="w-3.5 h-3.5 text-stone-500" />
            Archived
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Quizzes
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-xs"
            title="Copy style specifications"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Share Spec'}
          </button>

          <button
            type="button"
            onClick={() => onEdit(quiz.id)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Quiz
          </button>

          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/80 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Detail Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-[#1A1715] to-[#2B2420] text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
                Style Quiz Profile
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(quiz.status)}

              {/* Quick Status Cycler */}
              <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => onToggleStatus(quiz.id, 'draft')}
                  className={`px-2 py-0.5 rounded ${
                    quiz.status === 'draft' ? 'bg-amber-400 text-stone-900 font-bold' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus(quiz.id, 'completed')}
                  className={`px-2 py-0.5 rounded ${
                    quiz.status === 'completed' ? 'bg-emerald-500 text-white font-bold' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus(quiz.id, 'archived')}
                  className={`px-2 py-0.5 rounded ${
                    quiz.status === 'archived' ? 'bg-stone-600 text-white font-bold' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
            {quiz.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-stone-300">
            <span>Created {new Date(quiz.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            <span>•</span>
            <span>Last Updated {new Date(quiz.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-stone-400">ID: {quiz.id}</span>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="p-6 md:p-8 space-y-8">
          <div>
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-4">
              Curated Parameters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Aesthetic Style */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-2 text-amber-700 mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Aesthetic Style
                  </span>
                </div>
                <p className="text-base font-semibold text-stone-900">
                  {quiz.payload.aestheticStyle || 'Not Specified'}
                </p>
              </div>

              {/* Metal Preference */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-2 text-amber-700 mb-1.5">
                  <Sliders className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Precious Metal
                  </span>
                </div>
                <p className="text-base font-semibold text-stone-900">
                  {quiz.payload.metalPreference || 'Not Specified'}
                </p>
              </div>

              {/* Primary Gemstone */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-2 text-amber-700 mb-1.5">
                  <Gem className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Gemstone Choice
                  </span>
                </div>
                <p className="text-base font-semibold text-stone-900">
                  {quiz.payload.primaryGemstone || 'Not Specified'}
                </p>
              </div>

              {/* Budget Bracket */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center gap-2 text-amber-700 mb-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Budget Bracket
                  </span>
                </div>
                <p className="text-base font-semibold text-stone-900">
                  {quiz.payload.budgetRange || 'Not Specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Occasion Section */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Target Occasion
              </p>
              <p className="text-sm font-semibold text-stone-900 mt-0.5">
                {quiz.payload.occasionType || 'General Luxury'}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                JewelMind AI will prioritize pieces engineered to balance durability, brilliance, and dress-code formality for this event.
              </p>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Styling Notes & Heirloom Guidance
            </h3>
            <div className="p-5 rounded-xl bg-stone-50 border border-stone-200/70 text-sm text-stone-700 leading-relaxed min-h-[100px]">
              {quiz.payload.notes ? (
                <p className="whitespace-pre-wrap">{quiz.payload.notes}</p>
              ) : (
                <p className="text-stone-400 italic">
                  No additional notes provided for this quiz. Click &ldquo;Edit Quiz&rdquo; to add custom gemological requirements.
                </p>
              )}
            </div>
          </div>

          {/* Data Layer Verification Badge */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 gap-2">
            <span>
              Securely stored in Firestore &amp; PostgreSQL with Row-Level Security (<code className="text-[11px] bg-stone-100 px-1 py-0.5 rounded font-mono">user_id = auth.uid()</code>)
            </span>
            <span>TanStack Query cache synced</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteModalOpen}
        title={quiz.title}
        isDeleting={isDeleting}
        onConfirm={async () => {
          await onDelete(quiz.id);
          setDeleteModalOpen(false);
          onBack();
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
};
