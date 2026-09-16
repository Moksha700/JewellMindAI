import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { styleQuizSchema, StyleQuizFormData } from '../../schemas/styleQuizSchema';
import { StyleQuizItem } from '../../types/styleQuiz';
import { Sparkles, ArrowLeft, Loader2, Save, Gem, DollarSign, Calendar, Sliders } from 'lucide-react';

interface StyleQuizFormProps {
  initialData?: StyleQuizItem | null;
  mode: 'create' | 'edit';
  isPending: boolean;
  onSubmit: (data: StyleQuizFormData) => Promise<void> | void;
  onCancel: () => void;
}

const METALS = [
  'Platinum / White Gold',
  '18k Yellow Gold',
  '18k Rose Gold',
  'Two-Tone Gold (White & Yellow)',
  'Sterling Silver',
];

const GEMSTONES = [
  'Diamond (Brilliant / Cushion / Emerald)',
  'Colombian Emerald',
  'Ceylon Royal Sapphire',
  'Burmese Pigeon-Blood Ruby',
  'Akoya South Sea Pearl',
  'Colorless Moissanite',
  'Mixed Precious Gemstones',
];

const AESTHETIC_STYLES = [
  'Modern Minimalist',
  'Art Deco Vintage',
  'Royal Classic Heritage',
  'Avant-Garde Statement',
  'Bohemian Romance',
  'Architectural Geometry',
];

const BUDGETS = [
  'Under $2,500',
  '$2,500 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000+',
];

const OCCASIONS = [
  'Everyday Luxury',
  'Wedding & Engagement',
  'Black Tie Gala & Red Carpet',
  'Anniversary Milestone',
  'Cocktail Soirée & Reception',
  'Executive Gifting',
];

export const StyleQuizForm: React.FC<StyleQuizFormProps> = ({
  initialData,
  mode,
  isPending,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StyleQuizFormData>({
    resolver: zodResolver(styleQuizSchema),
    defaultValues: {
      title: initialData?.title || '',
      status: initialData?.status || 'draft',
      metalPreference: initialData?.payload?.metalPreference || METALS[0],
      primaryGemstone: initialData?.payload?.primaryGemstone || GEMSTONES[0],
      aestheticStyle: initialData?.payload?.aestheticStyle || AESTHETIC_STYLES[0],
      budgetRange: initialData?.payload?.budgetRange || BUDGETS[1],
      occasionType: initialData?.payload?.occasionType || OCCASIONS[0],
      notes: initialData?.payload?.notes || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        status: initialData.status,
        metalPreference: initialData.payload.metalPreference,
        primaryGemstone: initialData.payload.primaryGemstone,
        aestheticStyle: initialData.payload.aestheticStyle,
        budgetRange: initialData.payload.budgetRange,
        occasionType: initialData.payload.occasionType,
        notes: initialData.payload.notes || '',
      });
    }
  }, [initialData, reset]);

  const disabled = isPending || isSubmitting;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Form Header */}
      <div className="p-6 md:p-8 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-stone-50/50">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Quiz Records
          </button>
          <h2 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <Sparkles className="w-4 h-4" />
            </span>
            {mode === 'create' ? 'Create Style Quiz' : 'Edit Style Quiz Profile'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Define gemological preferences, aesthetics, and occasion parameters for JewelMind AI curations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="px-4 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
        
        {/* Title & Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="quiz-title" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Quiz Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="quiz-title"
              type="text"
              placeholder="e.g. Royal Wedding Diamond Parure, Minimalist Summer Ring"
              {...register('title')}
              disabled={disabled}
              className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                errors.title
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-stone-200 focus:ring-amber-500/20 focus:border-amber-500'
              } disabled:opacity-60`}
            />
            {errors.title && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="quiz-status" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              id="quiz-status"
              {...register('status')}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all disabled:opacity-60"
            >
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            {errors.status && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.status.message}</p>
            )}
          </div>
        </div>

        {/* Precious Metal & Primary Gemstone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-stone-100">
          <div>
            <label htmlFor="quiz-metal" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-stone-400" />
              Precious Metal Preference <span className="text-rose-500">*</span>
            </label>
            <select
              id="quiz-metal"
              {...register('metalPreference')}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all disabled:opacity-60"
            >
              {METALS.map((metal) => (
                <option key={metal} value={metal}>
                  {metal}
                </option>
              ))}
            </select>
            {errors.metalPreference && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.metalPreference.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="quiz-gemstone" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5 text-stone-400" />
              Primary Gemstone <span className="text-rose-500">*</span>
            </label>
            <select
              id="quiz-gemstone"
              {...register('primaryGemstone')}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all disabled:opacity-60"
            >
              {GEMSTONES.map((gem) => (
                <option key={gem} value={gem}>
                  {gem}
                </option>
              ))}
            </select>
            {errors.primaryGemstone && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.primaryGemstone.message}</p>
            )}
          </div>
        </div>

        {/* Aesthetic Style, Budget, Occasion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-stone-100">
          <div>
            <label htmlFor="quiz-style" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-stone-400" />
              Aesthetic Style <span className="text-rose-500">*</span>
            </label>
            <select
              id="quiz-style"
              {...register('aestheticStyle')}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all disabled:opacity-60"
            >
              {AESTHETIC_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
            {errors.aestheticStyle && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.aestheticStyle.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="quiz-budget" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-stone-400" />
              Budget Bracket <span className="text-rose-500">*</span>
            </label>
            <select
              id="quiz-budget"
              {...register('budgetRange')}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all disabled:opacity-60"
            >
              {BUDGETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {errors.budgetRange && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.budgetRange.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="quiz-occasion" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Occasion Target <span className="text-rose-500">*</span>
            </label>
            <select
              id="quiz-occasion"
              {...register('occasionType')}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all disabled:opacity-60"
            >
              {OCCASIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
            {errors.occasionType && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.occasionType.message}</p>
            )}
          </div>
        </div>

        {/* Stylistic Notes */}
        <div className="pt-2 border-t border-stone-100">
          <label htmlFor="quiz-notes" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
            Stylistic Notes & AI Prompt Guidance (Optional)
          </label>
          <textarea
            id="quiz-notes"
            rows={4}
            placeholder="Add any specific cuts (e.g., emerald cut, baguette shoulders), prong settings, heirloom references, or skin undertone considerations..."
            {...register('notes')}
            disabled={disabled}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all disabled:opacity-60"
          />
          {errors.notes && (
            <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.notes.message}</p>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="px-5 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-900" />
                <span>Saving Quiz...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-stone-900" />
                <span>{mode === 'create' ? 'Save Style Quiz' : 'Update Style Quiz'}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
