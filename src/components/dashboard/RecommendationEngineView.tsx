import React, { useState } from 'react';
import { JEWELLERY_CATALOG } from '../../data/catalog';
import { JewelleryCatalogItem } from '../../types';
import { Sparkles, Check, ArrowRight, Eye, Bookmark, Compass, RefreshCw } from 'lucide-react';
import { createJewelleryRecord } from '../../services/recordsService';
import { useToast } from '../../context/ToastContext';

interface RecommendationEngineViewProps {
  onSelectForTryOn: (item: JewelleryCatalogItem) => void;
  onRecordSaved: () => void;
}

export const RecommendationEngineView: React.FC<RecommendationEngineViewProps> = ({
  onSelectForTryOn,
  onRecordSaved,
}) => {
  const [neckline, setNeckline] = useState('Sweetheart');
  const [attireColor, setAttireColor] = useState('Noir Black');
  const [occasion, setOccasion] = useState('Black Tie Gala');
  const [metalPref, setMetalPref] = useState('18k Yellow Gold');
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  // Dynamic recommendation logic based on styling geometry
  const getRecommendation = () => {
    let matchedItem = JEWELLERY_CATALOG[0];
    let collarAdvice = '';
    let earringAdvice = '';
    let harmonyRatio = '98%';

    if (neckline === 'Sweetheart' || neckline === 'Deep V-Neck') {
      matchedItem = JEWELLERY_CATALOG[0]; // Aethel Solitaire Emerald Cut Pendant
      collarAdvice = '16-18 inch delicate drop or pendant necklace to nest naturally into the décolletage without crossing fabric boundaries.';
      earringAdvice = 'Subtle diamond studs or micro-hoops to allow the pendant centerpiece to command visual focus.';
    } else if (neckline === 'High-Neck / Halter') {
      matchedItem = JEWELLERY_CATALOG[1]; // Lumière Cascading Diamond Chandelier Drop
      collarAdvice = 'Skip collar necklaces entirely to prevent clashing with the high neckline silhouette.';
      earringAdvice = 'Dramatic cascading diamond drops or statement chandeliers that elongate the neck and balance the collar.';
    } else if (neckline === 'Strapless') {
      matchedItem = JEWELLERY_CATALOG[4]; // Aurelia Freshwater Keshi Pearl Collar
      collarAdvice = 'Statement collar choker or collar length pearls (14-16 inch) framing bare shoulders with organic warmth.';
      earringAdvice = 'Medium huggies or matching pearl drops for classic symmetry.';
    } else {
      matchedItem = JEWELLERY_CATALOG[2]; // Celeste Sapphire Halo Ring
      collarAdvice = 'Minimalist box chain or layered contour links.';
      earringAdvice = 'Architectural studs with gemstone halos matching your rings.';
    }

    return {
      matchedItem,
      collarAdvice,
      earringAdvice,
      harmonyRatio,
      colorAdvice: attireColor === 'Noir Black' 
        ? 'Black fabric creates maximum contrast, illuminating yellow gold and diamond brilliance.'
        : attireColor === 'Emerald Green'
        ? 'Deep green tones pair exceptionally with yellow gold or complementary emerald/diamond pieces.'
        : 'Cool jewel tones create refined balance with platinum and radiant diamonds.',
    };
  };

  const rec = getRecommendation();

  const handleSaveRecommendation = async () => {
    setSaving(true);
    try {
      await createJewelleryRecord({
        title: `AI Recommendation: ${rec.matchedItem.name}`,
        category: 'Recommendation Engine',
        occasion,
        metalType: metalPref,
        gemstone: rec.matchedItem.gemstone,
        notes: `Harmonized for ${neckline} neckline with ${attireColor} attire for ${occasion}. Neck advice: ${rec.collarAdvice}. Ear advice: ${rec.earringAdvice}.`,
        status: 'saved',
        imageUrl: rec.matchedItem.imageUrl,
        priceEstimate: `$${rec.matchedItem.price.toLocaleString()}`,
      });
      showToast('Recommendation saved to your records!', 'success');
      onRecordSaved();
    } catch (err) {
      showToast('Error saving recommendation.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>Haute Geometry Engine</span>
        </div>
        <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
          Wardrobe & Silhouette Recommendation Engine
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Specify your attire neckline and event palette to generate gemologically harmonized jewellery formulas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          
          {/* 1. Dress Neckline */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              1. Dress Neckline Silhouette
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Sweetheart',
                'Deep V-Neck',
                'High-Neck / Halter',
                'Strapless',
                'Boatneck / Crew',
                'Asymmetrical',
              ].map((neck) => (
                <button
                  key={neck}
                  type="button"
                  onClick={() => setNeckline(neck)}
                  className={`p-3 rounded-xl border text-xs text-left font-semibold transition-all ${
                    neckline === neck
                      ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {neck}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Attire Palette */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              2. Attire Color & Texture
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Noir Black',
                'Emerald Green',
                'Royal Navy',
                'Champagne Silk',
                'Ruby Crimson',
                'Snow White',
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAttireColor(c)}
                  className={`p-2.5 rounded-xl border text-xs text-left font-semibold transition-all ${
                    attireColor === c
                      ? 'border-amber-600 bg-amber-50 text-amber-950'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Occasion Formality */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              3. Event Formality
            </label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Black Tie Gala">Black Tie Gala (Formal Evening)</option>
              <option value="Wedding">Wedding (Bride or Guest)</option>
              <option value="Anniversary Gift">Anniversary / Milestone</option>
              <option value="Cocktail Soirée">Cocktail Soirée</option>
              <option value="Everyday Minimalist">Everyday Luxury Chic</option>
            </select>
          </div>

          {/* 4. Metal Preference */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              4. Metal Undertone
            </label>
            <div className="flex gap-2">
              {['18k Yellow Gold', 'Platinum / White Gold', '18k Rose Gold'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetalPref(m)}
                  className={`flex-1 py-2 px-1 text-[11px] rounded-lg border text-center font-semibold transition-all ${
                    metalPref === m
                      ? 'bg-amber-100 border-amber-400 text-amber-950'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {m.split('/')[0]}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Calculated AI Harmony Card (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
          
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                Optimal Harmony • Score {rec.harmonyRatio}
              </span>
              <h3 className="font-serif-luxury text-2xl font-bold text-stone-900 mt-1">
                {rec.matchedItem.name}
              </h3>
            </div>
            <span className="text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              Est. ${rec.matchedItem.price.toLocaleString()}
            </span>
          </div>

          {/* Visual Showcase */}
          <div className="flex flex-col sm:flex-row gap-5 items-center bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200">
            <img
              src={rec.matchedItem.imageUrl}
              alt={rec.matchedItem.name}
              className="w-36 h-36 rounded-xl object-cover border border-stone-200 shrink-0"
            />
            <div className="space-y-2">
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                {rec.matchedItem.description}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] bg-white border border-stone-200 px-2 py-0.5 rounded-md font-semibold text-stone-800">
                  {rec.matchedItem.metal}
                </span>
                <span className="text-[11px] bg-white border border-stone-200 px-2 py-0.5 rounded-md font-semibold text-stone-800">
                  {rec.matchedItem.gemstone}
                </span>
                <span className="text-[11px] bg-white border border-stone-200 px-2 py-0.5 rounded-md font-semibold text-stone-800">
                  {rec.matchedItem.style}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Styling Advice Blocks */}
          <div className="space-y-3 text-xs">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-600" />
                Neckline & Collarbone Alignment
              </span>
              <p className="text-stone-600 leading-relaxed pl-5">
                {rec.collarAdvice}
              </p>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-600" />
                Earring & Facial Framing Strategy
              </span>
              <p className="text-stone-600 leading-relaxed pl-5">
                {rec.earringAdvice}
              </p>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1">
              <span className="font-bold text-stone-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-600" />
                Chromatic Synergy
              </span>
              <p className="text-stone-600 leading-relaxed pl-5">
                {rec.colorAdvice}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveRecommendation}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-[#1A1715] hover:bg-[#2C2724] text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Recommendation to Vault</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectForTryOn(rec.matchedItem)}
              className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-stone-600" />
              <span>Test in Virtual Try-On</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
