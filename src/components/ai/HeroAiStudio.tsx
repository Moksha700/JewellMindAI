import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Copy, 
  Check, 
  RefreshCw, 
  Layers, 
  Cpu, 
  TrendingUp, 
  Eye, 
  Binary, 
  MessageSquareCode, 
  Clock, 
  History, 
  AlertCircle,
  Diamond,
  Sliders,
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { streamAiRun, fetchUserAiRuns } from '../../services/aiRunService';
import { AiCapability, AiRunRecord } from '../../types/aiRun';

const CAPABILITIES: {
  id: AiCapability;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  promptPlaceholder: string;
  samples: string[];
}[] = [
  {
    id: 'language_understanding',
    title: 'Language Understanding',
    tagline: 'Natural Language Processing for intuitive jewellery styling & discovery',
    icon: MessageSquareCode,
    promptPlaceholder: 'Describe your dream jewellery piece in natural language (e.g. "An Art Deco emerald engagement ring with baguette diamond halos in 18k warm yellow gold")...',
    samples: [
      'Art Deco emerald cut ring with tapered baguette shoulder diamonds in 18k yellow gold',
      'Modernist architectural choker featuring trillion-cut sapphires and brushed platinum',
      'Romantic vintage oval diamond pendant with delicate milgrain edging for an anniversary gift'
    ]
  },
  {
    id: 'predictions_recommendations',
    title: 'Predictions & Recommendations',
    tagline: 'Predictive analytics for style trends & tailored personal recommendations',
    icon: TrendingUp,
    promptPlaceholder: 'Ask for personalized trend forecasts and aesthetic predictions based on current luxury preferences...',
    samples: [
      'Predict next season’s trending gemstone cuts and pairing palettes for high-jewellery collections',
      'Recommend complementary metals and stones for a client with cool olive skin tone and minimalist style',
      'Forecast wedding ring design trends for bespoke 2026-2027 commissions'
    ]
  },
  {
    id: 'insights_dashboards',
    title: 'Insights & Dashboards',
    tagline: 'Data analytics on user preferences, trending styles, and popular categories',
    icon: Layers,
    promptPlaceholder: 'Request data insights on category demand, metal alloy market popularity, or design analytics...',
    samples: [
      'Analyze demand shifts between Platinum vs. Rose Gold in custom bridal jewellery',
      'Generate a market analysis breakdown for lab-grown vs. ethically mined Colombian emeralds',
      'Evaluate consumer preference ratios for bezel settings vs. classic prong solitaire rings'
    ]
  },
  {
    id: 'vision_capabilities',
    title: 'Vision Capabilities',
    tagline: 'Computer Vision guidance for advanced virtual try-on and realism evaluation',
    icon: Eye,
    promptPlaceholder: 'Inquire about photo try-on proportions, hand/neck contour harmony, and gemstone optical reflections...',
    samples: [
      'Analyze optical proportion guidelines for a 3-carat radiant cut diamond on slender hand anatomy',
      'Provide refraction and pavilion reflection specifications for photorealistic virtual try-on rendering',
      'Advise on necklace drop lengths and silhouette framing for halter-neck gown styling'
    ]
  },
  {
    id: 'automation_logic',
    title: 'Automation Logic',
    tagline: 'Atelier fabrication parameters, CAD specifications, and e-commerce pipelines',
    icon: Binary,
    promptPlaceholder: 'Generate structured manufacturing specs, metal alloy weight calculations, and custom commission JSON...',
    samples: [
      'Generate structured atelier CAD specifications and prong gauge requirements for a 2.5ct sapphire ring',
      'Format a custom commission intake schema compatible with luxury e-commerce order management',
      'Calculate estimated 18k gold wax weight and casting shrinkage allowances for a signet ring'
    ]
  }
];

export interface HeroAiStudioProps {
  initialPrompt?: string;
  initialCapability?: AiCapability;
  initialModel?: string;
  onNavigateToHistory?: () => void;
}

export const HeroAiStudio: React.FC<HeroAiStudioProps> = ({
  initialPrompt,
  initialCapability,
  initialModel,
  onNavigateToHistory,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeCapability, setActiveCapability] = useState<AiCapability>(
    initialCapability || 'language_understanding'
  );
  const [model, setModel] = useState<string>(initialModel || 'google/gemini-2.5-flash');
  const [prompt, setPrompt] = useState<string>(initialPrompt || '');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  
  // History runs from public.ai_runs
  const [history, setHistory] = useState<AiRunRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const responseEndRef = useRef<HTMLDivElement>(null);

  const currentCapConfig = CAPABILITIES.find((c) => c.id === activeCapability) || CAPABILITIES[0];

  // Sync if initial prompt / capability changes via Rerun
  useEffect(() => {
    if (initialPrompt !== undefined && initialPrompt !== '') {
      setPrompt(initialPrompt);
    }
    if (initialCapability) {
      setActiveCapability(initialCapability);
    }
    if (initialModel) {
      setModel(initialModel);
    }
  }, [initialPrompt, initialCapability, initialModel]);

  // Load past runs on mount / user change
  useEffect(() => {
    if (!user?.uid) return;
    setHistoryLoading(true);
    fetchUserAiRuns(user.uid)
      .then((records) => setHistory(records))
      .catch((err) => console.warn('Could not load AI run history:', err))
      .finally(() => setHistoryLoading(false));
  }, [user?.uid]);

  // Auto-scroll streaming output
  useEffect(() => {
    if (isStreaming && responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingResponse, isStreaming]);

  const handleRun = async (overridePrompt?: string) => {
    const textToRun = overridePrompt !== undefined ? overridePrompt : prompt;
    if (!textToRun.trim()) {
      showToast('Please enter an inquiry or select a sample prompt.', 'error');
      return;
    }

    if (isStreaming) return;

    setIsStreaming(true);
    setStreamingResponse('');

    await streamAiRun(
      {
        prompt: textToRun.trim(),
        capability: activeCapability,
        model,
      },
      {
        onToken: (token) => {
          setStreamingResponse((prev) => prev + token);
        },
        onError: ({ code, message }) => {
          setIsStreaming(false);

          // Requirements: Handle 429 (rate limit) and 402 (out of credits) with friendly toasts
          if (code === '429') {
            showToast(
              'AI Rate Limit Reached: The Lovable AI Gateway is busy. Please wait a moment before trying again.',
              'error'
            );
          } else if (code === '402') {
            showToast(
              'AI Credits Depleted: Workspace credits have been exhausted. Please recharge your plan to continue.',
              'error'
            );
          } else if (code === '401') {
            showToast(
              'Authentication required: Please sign in to consult JewelMind AI.',
              'error'
            );
          } else {
            showToast(message || 'An error occurred during AI execution.', 'error');
          }
        },
        onComplete: (fullText, runRecord) => {
          setIsStreaming(false);
          showToast('Haute AI Intelligence analysis complete!', 'success');
          if (runRecord) {
            setHistory((prev) => [runRecord, ...prev.filter((r) => r.id !== runRecord.id)]);
          }
        },
      }
    );
  };

  const handleCopy = () => {
    if (!streamingResponse) return;
    navigator.clipboard.writeText(streamingResponse);
    setCopied(true);
    showToast('Copied analysis to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HERO HEADER */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Lovable AI Gateway Integration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 tracking-tight">
              JewelMind Haute Intelligence Engine
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Powered by <span className="font-semibold text-amber-300">{model}</span> edge streaming. Experience multi-capability NLP styling, predictive trend forecasting, vision analytics, and automated custom commission logic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Model Badge */}
            <div className="bg-stone-800/90 border border-stone-700/80 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2 text-stone-300">
              <Cpu className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-semibold">Default Engine</p>
                <p className="font-mono text-amber-300 font-bold">{model}</p>
              </div>
            </div>

            {/* Full History Page Link */}
            {onNavigateToHistory && (
              <button
                id="hero-view-full-history-btn"
                onClick={onNavigateToHistory}
                className="px-3.5 py-2.5 rounded-2xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Open full AI History audit log"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Audit History</span>
              </button>
            )}

            {/* Quick Drawer History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-3 rounded-2xl border transition-all text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                showHistory 
                  ? 'bg-amber-400 text-stone-900 border-amber-400' 
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750'
              }`}
              title="View Run History (ai_runs)"
            >
              <span className="text-xs">Quick Drawer</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-stone-900 text-amber-300 text-[10px]">
                {history.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CAPABILITY SELECTOR TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          const isActive = activeCapability === cap.id;
          return (
            <button
              key={cap.id}
              onClick={() => {
                setActiveCapability(cap.id);
                setPrompt('');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-stone-50 hover:bg-white border-stone-200/90 text-stone-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-amber-50 text-amber-700' : 'bg-stone-200/70 text-stone-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isActive ? 'text-stone-900' : 'text-stone-700'}`}>
                  {cap.title}
                </p>
                <p className="text-[10px] text-stone-400 line-clamp-2 mt-1 leading-snug">
                  {cap.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE WITH INPUT & STREAMING VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Prompt Input & Quick Chips (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <currentCapConfig.icon className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  {currentCapConfig.title}
                </h3>
              </div>
              <span className="text-[11px] text-stone-400 font-mono">
                edge: /api/ai-run
              </span>
            </div>

            {/* Prompt Textarea */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={currentCapConfig.promptPlaceholder}
                rows={4}
                disabled={isStreaming}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none disabled:opacity-60"
              />
            </div>

            {/* Quick Inspiration Chips */}
            <div className="mt-4">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Suggested Curations:
              </p>
              <div className="space-y-1.5">
                {currentCapConfig.samples.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(sample);
                      handleRun(sample);
                    }}
                    disabled={isStreaming}
                    className="w-full text-left text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 p-2.5 rounded-xl transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
                  >
                    <span className="truncate pr-2">{sample}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>

            {/* Run Action Bar */}
            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auth: supabase.auth.getUser() &bull; RLS Enabled</span>
              </div>

              <button
                id="hero-ai-run-button"
                type="button"
                onClick={() => handleRun()}
                disabled={isStreaming || !prompt.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-900 font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isStreaming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Streaming Output...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-stone-900" />
                    <span>Consult JewelMind AI</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Streaming Output (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex-1 flex flex-col">
            
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Diamond className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Live Stream Output
                </span>
              </div>

              {streamingResponse && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy output"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 text-[11px] font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Output Display */}
            <div className="flex-1 min-h-[300px] max-h-[460px] overflow-y-auto pr-1 text-stone-800 text-xs sm:text-sm leading-relaxed font-sans">
              {streamingResponse ? (
                <div className="whitespace-pre-wrap space-y-2">
                  {streamingResponse}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-0.5 align-middle" />
                  )}
                  <div ref={responseEndRef} />
                </div>
              ) : isStreaming ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <p className="text-xs font-medium text-stone-500">
                    Connecting to Lovable AI Gateway & streaming tokens...
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-stone-400">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-stone-700">Awaiting Consultation</p>
                  <p className="text-[11px] text-stone-400 max-w-xs leading-relaxed">
                    Select a capability, enter your query or choose a quick curation, and watch the response stream in real time.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 4. RUN HISTORY (ai_runs table persisted) */}
      {showHistory && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-900">
                Run History (Saved to `public.ai_runs` & RLS Scoped)
              </h3>
            </div>
            <button
              onClick={() => {
                if (user?.uid) {
                  fetchUserAiRuns(user.uid).then(setHistory);
                }
              }}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {historyLoading ? (
            <div className="p-8 text-center text-xs text-stone-400">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
              <span>Loading historical AI runs...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              No previous AI runs found for this user account. Run your first query above!
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 transition-colors cursor-pointer group"
                  onClick={() => {
                    setActiveCapability(record.capability);
                    setPrompt(record.prompt);
                    setStreamingResponse(record.response);
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-800">
                      {record.capability.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(record.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-stone-900 line-clamp-1 mb-1">
                    {record.prompt}
                  </p>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {record.response}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
