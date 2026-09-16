import React, { useEffect, useState } from 'react';
import { X, Sparkles, RotateCw, Copy, Check, Clock, Cpu, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { AiRunRecord } from '../../types/aiRun';

interface RunDetailDrawerProps {
  run: AiRunRecord | null;
  onClose: () => void;
  onRerun: (run: AiRunRecord) => void;
}

export const RunDetailDrawer: React.FC<RunDetailDrawerProps> = ({ run, onClose, onRerun }) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!run) return null;

  const copyText = (text: string, type: 'prompt' | 'response') => {
    navigator.clipboard.writeText(text);
    if (type === 'prompt') {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  const formattedDate = new Date(run.created_at).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const isSuccess = run.status !== 'failed' && run.status !== 'error';

  return (
    <div id="ai-run-detail-overlay" className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        id="ai-run-detail-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="ai-run-detail-drawer"
          className="w-screen max-w-xl bg-white shadow-2xl border-l border-stone-200 flex flex-col transform transition ease-in-out duration-300 sm:duration-500"
        >
          {/* Header */}
          <div className="p-6 bg-stone-50 border-b border-stone-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
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
                    {isSuccess ? 'Completed' : 'Failed'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                    <Cpu className="w-3 h-3 text-amber-700" />
                    {run.model.replace('google/', '')}
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  AI Consultation Execution
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>
              <button
                id="close-detail-drawer-btn"
                onClick={onClose}
                className="rounded-full p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action: Rerun */}
            <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-mono">
                ID: {run.id.slice(0, 16)}...
              </span>
              <button
                id="drawer-rerun-btn"
                onClick={() => onRerun(run)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-sm font-medium shadow-xs transition-all hover:shadow-md"
              >
                <RotateCw className="w-4 h-4" />
                <span>Rerun in Studio</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Metadata Tags */}
            <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-stone-600 font-semibold block mb-0.5">
                  Haute Capability
                </span>
                <span className="text-sm font-medium text-stone-800 capitalize flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  {run.capability ? run.capability.replace('_', ' ') : 'Language Understanding'}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-stone-600 font-semibold block mb-0.5">
                  Model Architecture
                </span>
                <span className="text-sm font-medium text-stone-800 font-mono">
                  {run.model}
                </span>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                  Original Client Prompt
                </label>
                <button
                  onClick={() => copyText(run.prompt, 'prompt')}
                  className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-amber-700 transition-colors"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
                {run.prompt}
              </div>
            </div>

            {/* Response */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Atelier AI Synthesis & Response
                  </label>
                </div>
                <button
                  onClick={() => copyText(run.response, 'response')}
                  className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-amber-700 transition-colors"
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Synthesis</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white border border-stone-200 rounded-xl p-5 text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-sans select-text shadow-xs">
                {run.response || (
                  <span className="text-stone-400 italic">No output recorded for this run.</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onRerun(run)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-stone-900 hover:bg-black text-amber-400 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span>Load into Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
