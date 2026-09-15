import React, { useState } from 'react';
import { JEWELLERY_CATALOG, OCCASIONS_LIST, METALS_LIST } from '../../data/catalog';
import { JewelleryCatalogItem } from '../../types';
import { Heart, Eye, Sparkles, Filter, Search, Check, Layers } from 'lucide-react';
import { createJewelleryRecord } from '../../services/recordsService';
import { useToast } from '../../context/ToastContext';

interface OccasionFiltersViewProps {
  onSelectForTryOn: (item: JewelleryCatalogItem) => void;
  onRecordSaved: () => void;
}

export const OccasionFiltersView: React.FC<OccasionFiltersViewProps> = ({
  onSelectForTryOn,
  onRecordSaved,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState('All Occasions');
  const [selectedMetal, setSelectedMetal] = useState('All Metals');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const { showToast } = useToast();

  const filteredItems = JEWELLERY_CATALOG.filter((item) => {
    const matchesOccasion =
      selectedOccasion === 'All Occasions' || item.occasion.includes(selectedOccasion);
    const matchesMetal =
      selectedMetal === 'All Metals' || item.metal === selectedMetal;
    const matchesCat =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.style.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesOccasion && matchesMetal && matchesCat && matchesSearch;
  });

  const handleSaveFavorite = async (item: JewelleryCatalogItem) => {
    setSavingId(item.id);
    try {
      await createJewelleryRecord({
        title: item.name,
        category: 'Saved Favorites',
        occasion: item.occasion.join(', '),
        metalType: item.metal,
        gemstone: item.gemstone,
        notes: `Saved from Occasion Curations: ${item.description} (Style: ${item.style})`,
        status: 'saved',
        imageUrl: item.imageUrl,
        priceEstimate: `$${item.price.toLocaleString()}`,
      });
      showToast(`Added "${item.name}" to your Saved Favorites!`, 'success');
      onRecordSaved();
    } catch (err) {
      showToast('Error saving to favorites.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 mb-2">
            <Layers className="w-3.5 h-3.5 text-amber-700" />
            <span>Event & Wardrobe Intelligence</span>
          </div>
          <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
            Occasion Filters & Curation
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Filter fine jewellery tailored to event dress codes, lighting requirements, and metal warmth.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            id="occasion-catalog-search"
            type="text"
            placeholder="Search solitaire, emerald, gala..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 space-y-4 shadow-xs">
        
        {/* Occasions Row */}
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
            Target Occasion
          </span>
          <div className="flex flex-wrap gap-1.5">
            {OCCASIONS_LIST.map((occ) => (
              <button
                key={occ}
                type="button"
                onClick={() => setSelectedOccasion(occ)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedOccasion === occ
                    ? 'bg-[#1A1715] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Row: Metals & Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Precious Metal
            </span>
            <div className="flex flex-wrap gap-1.5">
              {METALS_LIST.map((met) => (
                <button
                  key={met}
                  type="button"
                  onClick={() => setSelectedMetal(met)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedMetal === met
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                      : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {met}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Jewellery Piece Type
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Necklace', 'Ring', 'Earrings', 'Bracelet'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-stone-800 text-white font-bold'
                      : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 space-y-3">
          <p className="font-serif-luxury text-xl font-bold text-stone-800">No matching pieces found</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your occasion or precious metal filters to explore other haute creations.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedOccasion('All Occasions');
              setSelectedMetal('All Metals');
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-stone-100 text-stone-800 text-xs font-bold rounded-xl hover:bg-stone-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Showcase */}
                <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {item.style}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveFavorite(item)}
                    disabled={savingId === item.id}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs hover:bg-white text-stone-700 hover:text-rose-600 flex items-center justify-center shadow-xs transition-colors"
                    aria-label="Save to favorites"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-700 font-semibold">{item.metal}</span>
                    <span className="text-sm font-bold text-stone-900">${item.price.toLocaleString()}</span>
                  </div>
                  <h3 className="font-serif-luxury text-lg font-bold text-stone-900 leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.occasion.map((occ) => (
                      <span
                        key={occ}
                        className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {occ}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-0 border-t border-stone-100 mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectForTryOn(item)}
                  className="flex-1 py-2.5 bg-[#1A1715] hover:bg-[#2E2825] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                  <span>Virtual Try-On</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveFavorite(item)}
                  disabled={savingId === item.id}
                  className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors"
                >
                  Save
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
