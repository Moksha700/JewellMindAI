import React, { useState, useEffect } from 'react';
import { JEWELLERY_CATALOG } from '../../data/catalog';
import { JewelleryCatalogItem } from '../../types';
import { 
  Eye, 
  RotateCw, 
  ZoomIn, 
  Sun, 
  Sparkles, 
  Camera, 
  Check, 
  Loader2, 
  Layers,
  ChevronRight,
  Move
} from 'lucide-react';
import { createJewelleryRecord } from '../../services/recordsService';
import { useToast } from '../../context/ToastContext';

interface VirtualTryOnStudioProps {
  initialItem?: JewelleryCatalogItem | null;
  onRecordSaved: () => void;
}

export const VirtualTryOnStudio: React.FC<VirtualTryOnStudioProps> = ({
  initialItem,
  onRecordSaved,
}) => {
  const [selectedItem, setSelectedItem] = useState<JewelleryCatalogItem>(
    initialItem || JEWELLERY_CATALOG[0]
  );
  const [anatomy, setAnatomy] = useState<'neck' | 'ear' | 'finger' | 'wrist'>('neck');
  const [skinTone, setSkinTone] = useState<'fair' | 'golden' | 'bronze' | 'olive'>('golden');
  const [scale, setScale] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [posX, setPosX] = useState<number>(0);
  const [luster, setLuster] = useState<'high-polish' | 'luminous' | 'satin'>('high-polish');
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (initialItem) {
      setSelectedItem(initialItem);
      setAnatomy(initialItem.tryOnType);
    }
  }, [initialItem]);

  // Skin tone backgrounds
  const skinToneStyles = {
    fair: 'bg-[#F9ECE3]',
    golden: 'bg-[#E5BF9C]',
    bronze: 'bg-[#8D5838]',
    olive: 'bg-[#D2A882]',
  };

  const handleSaveTryOn = async () => {
    setSaving(true);
    try {
      await createJewelleryRecord({
        title: `Try-On: ${selectedItem.name}`,
        category: 'Virtual Try-On',
        occasion: selectedItem.occasion[0] || 'Gala',
        metalType: selectedItem.metal,
        gemstone: selectedItem.gemstone,
        notes: `Virtual fitting test on ${anatomy} silhouette with ${skinTone} skin tone. Scale: ${scale}%, Angle: ${rotation}°, Finish: ${luster}. Verified proportional fit and collar drop balance.`,
        status: 'completed',
        imageUrl: selectedItem.imageUrl,
        priceEstimate: `$${selectedItem.price.toLocaleString()}`,
      });
      showToast('Virtual Try-On snapshot saved to your vault!', 'success');
      onRecordSaved();
    } catch (err) {
      showToast('Could not save try-on snapshot.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Digital Atelier & Fitting Room</span>
          </div>
          <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
            Interactive Virtual Try-On Studio
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Simulate realistic scale, collar drop, and gemstone specular luster on responsive anatomy models.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveTryOn}
          disabled={saving}
          className="px-5 py-2.5 bg-[#1A1715] hover:bg-[#2C2724] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
          ) : (
            <>
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Save Try-On Snapshot</span>
            </>
          )}
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Canvas Stage (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          
          {/* Canvas Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
            {/* Anatomy Selector */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              {[
                { id: 'neck', label: 'Neckline' },
                { id: 'ear', label: 'Earlobe' },
                { id: 'finger', label: 'Hand & Ring' },
                { id: 'wrist', label: 'Wrist' },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAnatomy(a.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    anatomy === a.id ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Skin Tone Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400 font-semibold uppercase">Skin Tone:</span>
              {(['fair', 'golden', 'bronze', 'olive'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSkinTone(t)}
                  aria-label={`Select ${t} skin tone`}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    skinTone === t ? 'ring-2 ring-stone-900 ring-offset-2 scale-110' : 'border-stone-300'
                  } ${skinToneStyles[t]}`}
                />
              ))}
            </div>
          </div>

          {/* Interactive Stage Preview Viewport */}
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 flex items-center justify-center select-none shadow-inner">
            
            {/* Anatomical Background Simulation */}
            <div className={`absolute inset-0 transition-colors duration-500 opacity-90 ${skinToneStyles[skinTone]}`}>
              {/* Silhouette Vector Overlay */}
              {anatomy === 'neck' && (
                <svg className="w-full h-full opacity-20" viewBox="0 0 400 300" fill="none" stroke="currentColor">
                  <path d="M120,40 Q150,140 200,160 Q250,140 280,40" strokeWidth="3" />
                  <path d="M70,220 Q200,260 330,220" strokeWidth="2" strokeDasharray="4 4" />
                  <ellipse cx="200" cy="180" rx="4" ry="4" fill="currentColor" />
                </svg>
              )}
              {anatomy === 'ear' && (
                <svg className="w-full h-full opacity-20" viewBox="0 0 400 300" fill="none" stroke="currentColor">
                  <path d="M180,60 C230,60 250,120 220,180 C200,220 170,230 160,200" strokeWidth="3" />
                  <circle cx="170" cy="195" r="4" fill="currentColor" />
                </svg>
              )}
              {anatomy === 'finger' && (
                <svg className="w-full h-full opacity-20" viewBox="0 0 400 300" fill="none" stroke="currentColor">
                  <path d="M160,280 L160,100 Q180,80 200,100 L200,280" strokeWidth="3" />
                  <path d="M160,180 L200,180" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              )}
              {anatomy === 'wrist' && (
                <svg className="w-full h-full opacity-20" viewBox="0 0 400 300" fill="none" stroke="currentColor">
                  <path d="M130,200 Q200,230 270,200" strokeWidth="4" />
                  <path d="M120,140 L120,290" strokeWidth="2" />
                  <path d="M280,140 L280,290" strokeWidth="2" />
                </svg>
              )}
            </div>

            {/* Positioned Jewellery Piece */}
            <div
              className="relative z-10 transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing group"
              style={{
                transform: `translate(${posX}px, ${posY}px) scale(${scale / 100}) rotate(${rotation}deg)`,
                filter:
                  luster === 'high-polish'
                    ? 'drop-shadow(0 15px 25px rgba(0,0,0,0.35)) brightness(1.08)'
                    : luster === 'luminous'
                    ? 'drop-shadow(0 10px 20px rgba(212,175,55,0.4)) contrast(1.1)'
                    : 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
              }}
            >
              <div className="relative">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-44 h-44 object-contain pointer-events-none drop-shadow-md"
                />
                {/* Luster highlight glow */}
                <div 
                  className={`absolute -top-1 -right-1 w-6 h-6 rounded-full blur-xs pointer-events-none ${
                    luster === 'high-polish' ? 'bg-white/80' : 'bg-amber-300/80'
                  }`} 
                />
              </div>
            </div>

            {/* Calibration HUD Badge */}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md rounded-xl px-3 py-1.5 text-white text-[11px] font-mono flex items-center gap-3">
              <span>SCALE: {scale}%</span>
              <span>ROT: {rotation}°</span>
              <span>{selectedItem.metal}</span>
            </div>

            {/* Position Reset Button */}
            <button
              type="button"
              onClick={() => {
                setScale(100);
                setRotation(0);
                setPosX(0);
                setPosY(0);
              }}
              className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-[11px] px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Reset Position
            </button>
          </div>

          {/* Interactive Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
            {/* Scale Slider */}
            <div className="space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div className="flex justify-between font-semibold text-stone-700">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5 text-stone-400" />
                  Scale / Carat Proportion
                </span>
                <span>{scale}%</span>
              </div>
              <input
                id="tryon-scale-slider"
                type="range"
                min="70"
                max="140"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div className="flex justify-between font-semibold text-stone-700">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-stone-400" />
                  Tilt & Angle
                </span>
                <span>{rotation}°</span>
              </div>
              <input
                id="tryon-rotation-slider"
                type="range"
                min="-30"
                max="30"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Position Nudge Controls */}
          <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
            <span className="font-semibold text-stone-700 flex items-center gap-1">
              <Move className="w-3.5 h-3.5 text-stone-400" />
              Fine Position Placement
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPosY((y) => y - 5)}
                className="w-7 h-7 bg-white border border-stone-200 rounded-lg font-bold hover:bg-stone-100 flex items-center justify-center"
                aria-label="Nudge up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => setPosY((y) => y + 5)}
                className="w-7 h-7 bg-white border border-stone-200 rounded-lg font-bold hover:bg-stone-100 flex items-center justify-center"
                aria-label="Nudge down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setPosX((x) => x - 5)}
                className="w-7 h-7 bg-white border border-stone-200 rounded-lg font-bold hover:bg-stone-100 flex items-center justify-center"
                aria-label="Nudge left"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setPosX((x) => x + 5)}
                className="w-7 h-7 bg-white border border-stone-200 rounded-lg font-bold hover:bg-stone-100 flex items-center justify-center"
                aria-label="Nudge right"
              >
                →
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Piece Selection & Metal Sheen (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Selected Piece Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Active Piece in Fitting Room
            </span>
            <div>
              <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
                {selectedItem.name}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {selectedItem.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-100">
              <div>
                <span className="text-stone-400 block text-[10px]">Composition</span>
                <span className="font-semibold text-stone-800">{selectedItem.metal}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Gemstone</span>
                <span className="font-semibold text-stone-800">{selectedItem.gemstone}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Investment</span>
                <span className="font-bold text-amber-900">${selectedItem.price.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Design Style</span>
                <span className="font-semibold text-stone-800">{selectedItem.style}</span>
              </div>
            </div>

            {/* Luster Selector */}
            <div className="space-y-2 pt-1">
              <span className="block text-xs font-bold text-stone-700">
                Specular Luster & Illumination
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'high-polish', label: 'High Polish' },
                  { id: 'luminous', label: 'Radiant Fire' },
                  { id: 'satin', label: 'Satin Brush' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLuster(l.id as any)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      luster === l.id
                        ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Switch Piece Catalog */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
            <span className="block text-xs font-bold text-stone-700">
              Select Another Piece to Try On
            </span>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {JEWELLERY_CATALOG.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                    setAnatomy(item.tryOnType);
                  }}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selectedItem.id === item.id
                      ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif-luxury text-sm font-bold text-stone-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {item.metal} • ${item.price.toLocaleString()}
                    </p>
                  </div>
                  {selectedItem.id === item.id && (
                    <Check className="w-4 h-4 text-amber-700 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
