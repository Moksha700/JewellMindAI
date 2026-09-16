import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  RotateCw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  RefreshCw, 
  X, 
  Cpu, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserAiRunsPage } from '../../services/aiRunService';
import { AiRunRecord } from '../../types/aiRun';
import { RunDetailDrawer } from './RunDetailDrawer';

interface AiHistoryPageProps {
  onRerunPrompt: (prompt: string, capability?: any, model?: string) => void;
  onNavigateToStudio: () => void;
}

const AVAILABLE_MODELS = [
  { id: 'all', label: 'All Architectures' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { id: 'google/gemini-2.5-flash-thinking', label: 'Gemini 2.5 Flash Thinking' },
];

export const AiHistoryPage: React.FC<AiHistoryPageProps> = ({ onRerunPrompt, onNavigateToStudio }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<string>('all');
  const [selectedRun, setSelectedRun] = useState<AiRunRecord | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // TanStack Query v5 Infinite Query for ai_runs
  // Page size: 25, Reverse-chronological (indexed on user_id, created_at desc)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['user_ai_runs', user?.uid, debouncedSearch, selectedModel, startDate, endDate],
    queryFn: ({ pageParam }) =>
      fetchUserAiRunsPage({
        userId: user?.uid || '',
        cursor: pageParam as string | null,
        pageSize: 25,
        searchQuery: debouncedSearch,
        model: selectedModel,
        startDate,
        endDate,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(user?.uid),
    staleTime: 1000 * 30, // 30 seconds
  });

  // Flatten infinite query pages
  const allRuns: AiRunRecord[] = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages[0]?.totalLoaded ?? allRuns.length;

  // Infinite scroll trigger via IntersectionObserver
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Date Presets Handler
  const handleDatePreset = (preset: 'all' | 'today' | '7d' | '30d') => {
    setActiveDatePreset(preset);
    const today = new Date();
    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      const todayStr = toDateStr(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7d') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      setStartDate(toDateStr(sevenDaysAgo));
      setEndDate(toDateStr(today));
    } else if (preset === '30d') {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      setStartDate(toDateStr(thirtyDaysAgo));
      setEndDate(toDateStr(today));
    }
  };

  const handleRerun = (run: AiRunRecord) => {
    setSelectedRun(null);
    onRerunPrompt(run.prompt, run.capability, run.model);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedModel('all');
    setStartDate('');
    setEndDate('');
    setActiveDatePreset('all');
  };

  const hasActiveFilters = Boolean(
    searchQuery || (selectedModel && selectedModel !== 'all') || startDate || endDate
  );

  return (
    <div id="ai-history-page" className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              Audit & Execution Log
            </span>
            <span className="text-xs text-stone-500 font-mono">
              RLS Scoped: auth.uid()
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            AI Consultation History
          </h1>
          <p className="text-stone-600 text-sm mt-1 max-w-2xl">
            Inspect, audit, and re-execute historical atelier intelligence runs with token-accurate recall and prompt pre-filling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="refresh-history-btn"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors shadow-xs"
            title="Refresh runs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-amber-600' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            id="new-ai-run-cta-top"
            onClick={onNavigateToStudio}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-amber-400 text-sm font-medium transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch New Run</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Substring Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="ai-history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, gemstone criteria, responses..."
              className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Model Filter */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <select
                id="ai-history-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full appearance-none pl-9 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <Cpu className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Date Range & Presets Row */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-stone-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Date Presets:
            </span>
            {(['all', 'today', '7d', '30d'] as const).map((preset) => (
              <button
                key={preset}
                id={`preset-${preset}`}
                onClick={() => handleDatePreset(preset)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeDatePreset === preset
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {preset === 'all' && 'All Time'}
                {preset === 'today' && 'Today'}
                {preset === '7d' && 'Past 7 Days'}
                {preset === '30d' && 'Past 30 Days'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ai-history-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-hidden focus:border-amber-500"
              title="Start Date"
            />
            <span className="text-stone-400">to</span>
            <input
              id="ai-history-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-hidden focus:border-amber-500"
              title="End Date"
            />
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-amber-700 hover:text-amber-900 font-medium ml-2 underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {/* Table / List Header */}
        <div className="px-6 py-3.5 bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-3 sm:col-span-2">Timestamp</div>
          <div className="col-span-3 sm:col-span-2">Model</div>
          <div className="col-span-4 sm:col-span-6">Prompt (First 120 chars)</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-stone-700">Loading AI consultation history...</p>
            <p className="text-xs text-stone-400 mt-1">Retrieving user-scoped ai_runs...</p>
          </div>
        )}

        {/* Empty State: No runs yet */}
        {!isLoading && allRuns.length === 0 && !hasActiveFilters && (
          <div id="ai-history-empty-state" className="py-20 px-4 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              No runs yet — try the AI feature
            </h3>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              Launch your first consultation in the Haute AI Studio to generate bespoke jewellery styling, metal pairings, and gemological directives.
            </p>
            <button
              id="empty-state-studio-cta"
              onClick={onNavigateToStudio}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-sm font-medium shadow-md transition-all hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Experience JewelMind AI</span>
            </button>
          </div>
        )}

        {/* Empty State: No search results */}
        {!isLoading && allRuns.length === 0 && hasActiveFilters && (
          <div id="ai-history-no-results" className="py-16 px-4 text-center max-w-md mx-auto">
            <Filter className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900 mb-1">
              No executions match your criteria
            </h3>
            <p className="text-stone-500 text-xs mb-4">
              Try adjusting your keyword search, model selection, or date range filters.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Reverse-chronological Rows */}
        {!isLoading && allRuns.length > 0 && (
          <div className="divide-y divide-stone-100" id="ai-history-rows">
            {allRuns.map((run) => {
              const dateObj = new Date(run.created_at);
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              // Truncate prompt to first 120 characters
              const promptPreview =
                run.prompt.length > 120 ? `${run.prompt.slice(0, 120)}...` : run.prompt;

              const isSuccess = run.status !== 'failed' && run.status !== 'error';
              const cleanModel = run.model.replace('google/', '');

              return (
                <div
                  key={run.id}
                  id={`ai-run-row-${run.id}`}
                  onClick={() => setSelectedRun(run)}
                  className="group px-6 py-4 hover:bg-amber-50/40 cursor-pointer transition-colors grid grid-cols-12 gap-4 items-center"
                >
                  {/* Timestamp */}
                  <div className="col-span-3 sm:col-span-2">
                    <div className="text-xs font-medium text-stone-900">{formattedDate}</div>
                    <div className="text-[11px] text-stone-500 font-mono">{formattedTime}</div>
                  </div>

                  {/* Model */}
                  <div className="col-span-3 sm:col-span-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-stone-100 group-hover:bg-amber-100 text-stone-700 group-hover:text-amber-900 border border-stone-200 transition-colors">
                      <Cpu className="w-3 h-3 text-stone-500 group-hover:text-amber-700" />
                      <span className="truncate max-w-[110px]">{cleanModel}</span>
                    </span>
                  </div>

                  {/* Prompt Preview (First 120 chars) */}
                  <div className="col-span-4 sm:col-span-6 pr-2">
                    <p className="text-xs text-stone-700 group-hover:text-stone-900 line-clamp-2 leading-relaxed">
                      {promptPreview}
                    </p>
                  </div>

                  {/* Status Badge & Action arrow */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isSuccess
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-600" />
                      )}
                      <span className="hidden sm:inline">{isSuccess ? 'Completed' : 'Failed'}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Trigger & Loader */}
        <div ref={loadMoreRef} className="py-4 text-center border-t border-stone-100">
          {isFetchingNextPage && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Loading more executions...</span>
            </div>
          )}
          {!hasNextPage && allRuns.length > 0 && (
            <span className="text-[11px] text-stone-400 uppercase tracking-wider">
              Showing all {allRuns.length} recorded runs
            </span>
          )}
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      <RunDetailDrawer
        run={selectedRun}
        onClose={() => setSelectedRun(null)}
        onRerun={handleRerun}
      />
    </div>
  );
};
