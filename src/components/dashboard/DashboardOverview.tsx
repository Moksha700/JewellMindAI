import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { JewelleryRecordDoc, RecordCategory } from '../../types';
import { 
  Sparkles, 
  Layers, 
  Eye, 
  Heart, 
  Compass, 
  Plus, 
  Clock, 
  Settings, 
  Search, 
  Filter, 
  ArrowUpRight, 
  FileText,
  Calendar,
  ExternalLink,
  ChevronRight,
  Diamond,
  BookOpen,
  Download
} from 'lucide-react';
import { generateKnowledgeBasePDF } from '../../utils/pdfGenerator';

interface DashboardOverviewProps {
  records: JewelleryRecordDoc[];
  loadingRecords: boolean;
  onOpenQuiz: () => void;
  onOpenOccasions: () => void;
  onOpenTryOn: () => void;
  onOpenRecommendations: () => void;
  onOpenSettings: () => void;
  onSelectRecord: (rec: JewelleryRecordDoc) => void;
  onNavigateTab: (tabId: string) => void;
  onOpenKnowledgeBase?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  records,
  loadingRecords,
  onOpenQuiz,
  onOpenOccasions,
  onOpenTryOn,
  onOpenRecommendations,
  onOpenSettings,
  onSelectRecord,
  onNavigateTab,
  onOpenKnowledgeBase,
}) => {
  const { profile } = useAuth();
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Calculate KPI stats from user's records
  const quizCount = records.filter((r) => r.category === 'Style Quiz').length;
  const tryOnCount = records.filter((r) => r.category === 'Virtual Try-On').length;
  const favoritesCount = records.filter((r) => r.category === 'Saved Favorites').length;
  const recommendationsCount = records.filter((r) => r.category === 'Recommendation Engine' || r.category === 'Occasion Match').length;

  // Filtered records for table/list
  const filteredRecords = records.filter((r) => {
    const matchesCat = filterCategory === 'All' || r.category === filterCategory;
    const matchesSearch = 
      searchTerm === '' ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.occasion && r.occasion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.metalType && r.metalType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const firstName = profile?.firstName || 'Collector';

  return (
    <div className="space-y-8 font-sans-clean">
      
      {/* 1. GREETING BLOCK: 'Welcome back, {first_name}' */}
      <div 
        id="dashboard-greeting-block"
        className="relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E2D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Private Atelier Vault</span>
          </div>
          <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#1A1715] tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Your personal gemological styling studio is ready. Review your saved Try-On snapshots, run custom wardrobe harmonizations, or launch an AI style diagnostic.
          </p>
        </div>

        {/* Quick Actions: 'Create new', 'Haute AI Studio', 'View history', 'Open settings' */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            id="quick-action-ai-studio"
            onClick={() => onNavigateTab('hero_ai')}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-stone-950" />
            <span>Haute AI Studio</span>
          </button>
          <button
            id="quick-action-create"
            onClick={onOpenQuiz}
            className="px-4 py-2.5 bg-[#1A1715] hover:bg-[#2E2825] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Style Quiz</span>
          </button>
          <button
            id="quick-action-history"
            onClick={() => onNavigateTab('ai_history')}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <Clock className="w-4 h-4 text-stone-500" />
            <span>AI History</span>
          </button>
          <button
            id="quick-action-kb"
            onClick={onOpenKnowledgeBase}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 focus:outline-none cursor-pointer shadow-xs"
            title="Open Knowledge Base & Download PDF"
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Knowledge Base</span>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">PDF</span>
          </button>
          <button
            id="quick-action-settings"
            onClick={onOpenSettings}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors focus:outline-none"
            aria-label="Open settings"
            title="Open settings"
          >
            <Settings className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>

      {/* 2. KPI ROW (4 STAT CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Saved Favorites</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-luxury text-3xl font-bold text-stone-900">{favoritesCount}</p>
          <p className="text-[11px] text-stone-500">Bookmarked fine jewellery pieces</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Style Quizzes</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-luxury text-3xl font-bold text-stone-900">{quizCount}</p>
          <p className="text-[11px] text-stone-500">Completed aesthetic diagnostics</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Virtual Try-Ons</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-luxury text-3xl font-bold text-stone-900">{tryOnCount}</p>
          <p className="text-[11px] text-stone-500">Saved digital fitting snapshots</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Harmonizations</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-luxury text-3xl font-bold text-stone-900">{recommendationsCount}</p>
          <p className="text-[11px] text-stone-500">Neckline & attire pairings</p>
        </div>

      </div>

      {/* 3. CARDS REFLECTING THE APP'S CORE CAPABILITIES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
            Core Capabilities
          </h2>
          <span className="text-xs text-stone-500">Instant interactive studio tools</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Style Quiz */}
          <div
            id="capability-card-quiz"
            onClick={onOpenQuiz}
            className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs hover:shadow-md hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                Style Quiz
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Take a 5-step diagnostic for metal, stone, and silhouette alignment.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-amber-800 group-hover:text-amber-900">
              <span>Start Diagnostic</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Occasion Filters */}
          <div
            id="capability-card-occasions"
            onClick={onOpenOccasions}
            className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs hover:shadow-md hover:border-stone-400 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                Occasion Filters
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Filter collections calibrated for Galas, Weddings, and Anniversaries.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-stone-800 group-hover:text-stone-950">
              <span>Filter Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Virtual Try-On */}
          <div
            id="capability-card-tryon"
            onClick={onOpenTryOn}
            className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs hover:shadow-md hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                Virtual Try-On
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Render necklaces, solitaires, and chandelier drops on responsive mannequins.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-amber-800 group-hover:text-amber-900">
              <span>Open Fitting Room</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Recommendation Engine */}
          <div
            id="capability-card-recommendations"
            onClick={onOpenRecommendations}
            className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs hover:shadow-md hover:border-stone-400 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                Recommendation Engine
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Match neckline geometry and dress colors to harmonic proportions.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-emerald-800 group-hover:text-emerald-950">
              <span>Harmonize Attire</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 5: Saved Favorites */}
          <div
            id="capability-card-favorites"
            onClick={() => {
              setFilterCategory('Saved Favorites');
              const el = document.getElementById('primary-work-area');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white p-5 rounded-3xl border border-[#E7E2D8] shadow-xs hover:shadow-md hover:border-rose-300 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                Saved Favorites
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Curate your wishlist of verified fine pieces, specs, and price quotes.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1 text-xs font-bold text-rose-800 group-hover:text-rose-950">
              <span>View Favorites</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 6: Knowledge Base & PDF Manual */}
          <div
            id="capability-card-knowledge-base"
            onClick={onOpenKnowledgeBase}
            className="bg-white p-5 rounded-3xl border-2 border-amber-300/80 shadow-xs hover:shadow-md hover:border-amber-500 cursor-pointer transition-all flex flex-col justify-between group bg-gradient-to-b from-amber-50/30 to-white"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#1A1715] text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <BookOpen className="w-5 h-5 text-amber-300" />
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                  PDF Available
                </span>
              </div>
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                Knowledge Base (KB)
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Official guide to Gemini 2.5, 4Cs diamond physics, metallurgy, and virtual try-on mechanics.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 group-hover:text-amber-950 flex items-center gap-1">
                <span>Read & Export PDF</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  generateKnowledgeBasePDF();
                }}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 transition-colors"
                title="Download Knowledge Base PDF directly"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 4. PRIMARY WORK AREA: A LIST/TABLE OF THE USER'S RECORDS WITH EMPTY STATE */}
      <div 
        id="primary-work-area" 
        className="bg-white rounded-3xl border border-[#E7E2D8] shadow-xs p-6 sm:p-8 space-y-6"
      >
        
        {/* Work Area Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
              Your Jewellery Records & Vault
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Securely scoped to your user account via Firebase Cloud RLS.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search records..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="py-1.5 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Categories ({records.length})</option>
              <option value="Style Quiz">Style Quiz</option>
              <option value="Virtual Try-On">Virtual Try-On</option>
              <option value="Occasion Match">Occasion Match</option>
              <option value="Recommendation Engine">Recommendation Engine</option>
              <option value="Saved Favorites">Saved Favorites</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredRecords.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mx-auto">
              <Diamond className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
                No Jewellery Records Found
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                You haven't archived any styling consultations or try-on snapshots yet. Start by taking our AI Style Quiz or exploring the Virtual Try-On studio.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onOpenQuiz}
                className="px-4 py-2 bg-[#1A1715] text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors"
              >
                Take Style Quiz
              </button>
              <button
                type="button"
                onClick={onOpenTryOn}
                className="px-4 py-2 bg-stone-100 text-stone-800 text-xs font-bold rounded-xl hover:bg-stone-200 transition-colors"
              >
                Launch Virtual Try-On
              </button>
            </div>
          </div>
        ) : (
          /* Records Table & List */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50/80 text-stone-500 uppercase tracking-wider text-[10px] font-semibold border-y border-stone-200">
                <tr>
                  <th scope="col" className="py-3 px-4">Item & Title</th>
                  <th scope="col" className="py-3 px-4">Category</th>
                  <th scope="col" className="py-3 px-4">Occasion / Metal</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Date Added</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredRecords.map((rec) => (
                  <tr 
                    key={rec.id}
                    onClick={() => onSelectRecord(rec)}
                    className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-stone-900 flex items-center gap-3">
                      {rec.imageUrl ? (
                        <img
                          src={rec.imageUrl}
                          alt={rec.title}
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                          <Diamond className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-serif-luxury text-sm font-bold text-stone-900 block truncate">
                          {rec.title}
                        </span>
                        {rec.priceEstimate && (
                          <span className="text-[11px] text-amber-800 font-semibold">{rec.priceEstimate}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rec.category === 'Virtual Try-On'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : rec.category === 'Style Quiz'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : rec.category === 'Saved Favorites'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-stone-100 text-stone-800'
                      }`}>
                        {rec.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-stone-900 font-semibold block">{rec.occasion || 'General'}</span>
                        <span className="text-[11px] text-stone-400">{rec.metalType || 'Fine Metal'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="capitalize">{rec.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-stone-400 text-[11px]">
                      {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRecord(rec);
                        }}
                        className="py-1 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg transition-colors text-[11px]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
