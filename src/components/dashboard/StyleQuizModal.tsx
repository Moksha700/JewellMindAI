import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, ArrowLeft, Loader2, Diamond } from 'lucide-react';
import { JEWELLERY_CATALOG } from '../../data/catalog';
import { createJewelleryRecord } from '../../services/recordsService';
import { useToast } from '../../context/ToastContext';

interface StyleQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordSaved: () => void;
}

export const StyleQuizModal: React.FC<StyleQuizModalProps> = ({ isOpen, onClose, onRecordSaved }) => {
  const [step, setStep] = useState(1);
  const [metal, setMetal] = useState('18k Yellow Gold');
  const [gemstone, setGemstone] = useState('Diamond');
  const [aesthetic, setAesthetic] = useState('Art Deco');
  const [occasion, setOccasion] = useState('Black Tie Gala');
  const [budget, setBudget] = useState('$1,000 - $3,000');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleFinish = async () => {
    // Determine best match from catalog
    const matched = JEWELLERY_CATALOG.find(
      (j) => j.metal.includes(metal.split(' ')[1] || metal) || j.gemstone === gemstone || j.style === aesthetic
    ) || JEWELLERY_CATALOG[0];

    const quizOutcome = {
      title: `AI Match: ${matched.name}`,
      category: 'Style Quiz' as const,
      occasion,
      metalType: metal,
      gemstone,
      notes: `Style diagnostic result for ${occasion}. Preferred ${metal} with ${gemstone} accents in a ${aesthetic} aesthetic. Budget tier: ${budget}. Proportional balance rated 98%.`,
      status: 'completed' as const,
      imageUrl: matched.imageUrl,
      priceEstimate: `$${matched.price.toLocaleString()}`,
      matchedItem: matched,
    };

    setResult(quizOutcome);
    setStep(6);
  };

  const handleSaveToVault = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await createJewelleryRecord({
        title: result.title,
        category: 'Style Quiz',
        occasion: result.occasion,
        metalType: result.metalType,
        gemstone: result.gemstone,
        notes: result.notes,
        status: 'completed',
        imageUrl: result.imageUrl,
        priceEstimate: result.priceEstimate,
      });
      showToast('Style quiz results saved to your personal records!', 'success');
      onRecordSaved();
      onClose();
    } catch (err) {
      showToast('Failed to save quiz results.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      id="style-quiz-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="relative bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h2 id="quiz-modal-title" className="font-serif-luxury text-xl font-bold text-stone-900">
                AI Jewellery Style Quiz
              </h2>
              <p className="text-xs text-stone-500">Step {step <= 5 ? step : 5} of 5 • Tailored diagnostic</p>
            </div>
          </div>
          <button
            id="quiz-close-button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close Quiz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-amber-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.min((step / 5) * 100, 100)}%` }}
          />
        </div>

        {/* Step 1: Metal */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              1. Which precious metal harmonizes best with your skin undertone?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: '18k Yellow Gold', desc: 'Warm, classic, regal luster', color: 'bg-amber-100/70 border-amber-300' },
                { name: 'Platinum / White Gold', desc: 'Cool, luminous, high reflection', color: 'bg-slate-100 border-slate-300' },
                { name: '18k Rose Gold', desc: 'Romantic, blush warmth', color: 'bg-rose-100/70 border-rose-300' },
              ].map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setMetal(m.name)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    metal === m.name
                      ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/50 shadow-xs'
                      : 'border-stone-200 hover:border-stone-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-stone-900">{m.name}</span>
                    {metal === m.name && <Check className="w-4 h-4 text-amber-700" />}
                  </div>
                  <p className="text-xs text-stone-500">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Gemstone */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              2. What is your centerpiece gemstone preference?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Diamond', tag: 'Brilliance & Fire' },
                { name: 'Emerald', tag: 'Vivid Colombian Green' },
                { name: 'Sapphire', tag: 'Royal Ceylon Deep Blue' },
                { name: 'Pearl', tag: 'Organic Luster & Grace' },
              ].map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => setGemstone(g.name)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    gemstone === g.name
                      ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/50'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <Diamond className="w-5 h-5 mx-auto mb-2 text-stone-700" />
                  <p className="font-semibold text-sm text-stone-900">{g.name}</p>
                  <p className="text-[11px] text-stone-500 mt-1">{g.tag}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Aesthetic Vibe */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              3. Which aesthetic best mirrors your signature wardrobe?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Art Deco', desc: 'Architectural geometry & step-cut stones' },
                { name: 'Modern Minimalist', desc: 'Clean lines, fluid silhouettes, stacking simplicity' },
                { name: 'Royal Classic', desc: 'Intricate pavé, vintage halos, heirloom majesty' },
              ].map((a) => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => setAesthetic(a.name)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    aesthetic === a.name
                      ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/50'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <span className="font-semibold text-sm text-stone-900 block mb-1">{a.name}</span>
                  <p className="text-xs text-stone-500">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Occasion */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              4. What occasion or event are you shopping for?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                'Black Tie Gala',
                'Wedding',
                'Anniversary Gift',
                'Everyday Minimalist',
                'Cocktail Soirée',
                'Milestone Celebration',
              ].map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setOccasion(occ)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    occasion === occ
                      ? 'border-amber-600 bg-amber-50 font-bold text-amber-900 shadow-xs'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-sm">{occ}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Budget */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              5. What is your comfortable investment range?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Under $1,000', label: 'Everyday fine jewellery & chic essentials' },
                { name: '$1,000 - $3,000', label: 'Signature solitaires, pearls & contour bands' },
                { name: '$3,000 - $6,000', label: 'Heirloom sapphire halos & tennis bracelets' },
                { name: '$6,000+ Bespoke', label: 'High jewellery commissions & rare gemstones' },
              ].map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => setBudget(b.name)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    budget === b.name
                      ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="font-bold text-sm text-stone-900 block">{b.name}</span>
                  <span className="text-xs text-stone-500">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Results Showcase */}
        {step === 6 && result && (
          <div className="space-y-6">
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row gap-5 items-center">
              <img
                src={result.imageUrl}
                alt={result.title}
                className="w-32 h-32 rounded-xl object-cover border border-stone-200 shrink-0"
              />
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Calculated Harmony: 98%
                </span>
                <h4 className="font-serif-luxury text-2xl font-bold text-stone-900">
                  {result.title}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {result.notes}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                  <span className="text-xs bg-stone-200 px-2.5 py-1 rounded-md text-stone-800 font-medium">
                    {result.metalType}
                  </span>
                  <span className="text-xs bg-stone-200 px-2.5 py-1 rounded-md text-stone-800 font-medium">
                    {result.gemstone}
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md font-bold">
                    Est. {result.priceEstimate}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveToVault}
                disabled={saving}
                className="flex-1 py-3 px-4 bg-[#1A1715] hover:bg-[#2C2724] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Save to My Jewellery Records</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm rounded-xl transition-all"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        {step <= 5 && (
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 py-2 px-3 rounded-lg hover:bg-stone-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#1A1715] text-white py-2.5 px-5 rounded-xl hover:bg-stone-800 transition-all shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-2 text-sm font-semibold bg-amber-600 text-white py-2.5 px-6 rounded-xl hover:bg-amber-700 transition-all shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Calculate My Matches</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
