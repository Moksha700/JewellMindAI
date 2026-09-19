import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  BookOpen,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Info,
  ShieldCheck,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { askKnowledgeBaseRAG } from '../../services/ragService';
import { getKnowledgeBaseStats } from '../../services/knowledgeBaseService';
import { ChatMessage } from '../../types/chat';

interface AiChatbotProps {
  onNavigateToKnowledgeBase?: () => void;
  onClose?: () => void;
  isFloating?: boolean;
  className?: string;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: `Welcome to the Haute Jewellery Intelligence Chat. 

I am grounded directly in your uploaded Knowledge Base documents. Ask me about your atelier gemstone specs, gold alloy ratios, ring setting guidelines, or custom couture rules. 

If an answer is not found within your uploaded documents, I will inform you immediately rather than speculating.`,
  timestamp: Date.now(),
};

const SUGGESTED_QUESTIONS = [
  'What are the exact alloy ratios for 18k yellow gold?',
  'What diamond color range is recommended for platinum settings?',
  'What are the Art Deco rules for calibrated baguette halos?',
  'Which jewelry pairings suit Black-Tie and Red Carpet occasions?',
];

export const AiChatbot: React.FC<AiChatbotProps> = ({
  onNavigateToKnowledgeBase,
  onClose,
  isFloating = false,
  className = '',
}) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`jewelmind_chat_${user?.uid || 'anon'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamResponse, setCurrentStreamResponse] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalDocuments: 0, totalChunks: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load Knowledge Base statistics
  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const s = await getKnowledgeBaseStats(user?.uid);
        if (isMounted) setStats(s);
      } catch {
        // Ignore stats fetch error
      }
    };
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Persist messages in localStorage for continuity
  useEffect(() => {
    try {
      localStorage.setItem(
        `jewelmind_chat_${user?.uid || 'anon'}`,
        JSON.stringify(messages)
      );
    } catch {
      // Fallback
    }
  }, [messages, user?.uid]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamResponse, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    // Append user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);
    setCurrentStreamResponse('');

    try {
      let accumulatedAnswer = '';

      const response = await askKnowledgeBaseRAG({
        question: query,
        userId: user?.uid,
        onToken: (token) => {
          accumulatedAnswer += token;
          setCurrentStreamResponse(accumulatedAnswer);
        },
        onError: (error) => {
          showToast(error.message || 'Retrieval error', 'error');
        },
        onComplete: (finalAnswer, retrievedChunks, grounded) => {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: finalAnswer,
            timestamp: Date.now(),
            sources: retrievedChunks,
            grounded,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setCurrentStreamResponse('');
          setIsLoading(false);
        },
      });

      // If stream ended synchronously without onComplete firing
      if (isLoading && response.answer && !currentStreamResponse) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          timestamp: Date.now(),
          sources: response.retrievedChunks,
          grounded: response.grounded,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }
    } catch (err: any) {
      setIsLoading(false);
      setCurrentStreamResponse('');
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error retrieving information: ${err.message || 'Unable to connect to the knowledge retrieval engine.'}`,
        timestamp: Date.now(),
        grounded: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
      showToast('Error communicating with RAG engine', 'error');
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all conversation messages?')) {
      setMessages([INITIAL_WELCOME_MESSAGE]);
      setCurrentStreamResponse('');
      try {
        localStorage.removeItem(`jewelmind_chat_${user?.uid || 'anon'}`);
      } catch {
        // Fallback
      }
      showToast('Conversation cleared', 'info');
      inputRef.current?.focus();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div
      id="ai-knowledge-chatbot-root"
      className={`bg-white rounded-3xl border border-stone-200 flex flex-col overflow-hidden ${
        isFloating ? 'h-full w-full shadow-2xl' : 'h-[750px] max-h-[85vh] shadow-sm'
      } ${className}`}
    >
      {/* 1. Chatbot Header */}
      <div
        id="chatbot-header"
        className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between gap-2 shrink-0"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#1A1715] text-amber-300 flex items-center justify-center shadow-xs shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-serif-luxury text-sm sm:text-base md:text-lg font-bold text-stone-900 truncate">
                Knowledge Base AI Assistant
              </h2>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                RAG Active
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 flex items-center gap-1 mt-0.5 truncate">
              <span>Grounded in</span>
              <strong className="text-stone-700">{stats.totalDocuments} docs</strong>
              <span>({stats.totalChunks} chunks)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onNavigateToKnowledgeBase && (
            <button
              id="chatbot-nav-kb-btn"
              type="button"
              onClick={onNavigateToKnowledgeBase}
              className="text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:border-stone-300 px-2 sm:px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Manage uploaded documents"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Docs</span>
            </button>
          )}

          <button
            id="chatbot-clear-btn"
            type="button"
            onClick={handleClearChat}
            className="text-xs text-stone-500 hover:text-rose-600 bg-white border border-stone-200 hover:border-rose-200 px-2 sm:px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Clear current conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Clear</span>
          </button>

          {onClose && (
            <button
              id="chatbot-close-btn"
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-800 bg-white border border-stone-200 hover:border-stone-300 p-1.5 rounded-xl transition-colors cursor-pointer"
              title="Close chat panel"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages Stream View */}
      <div
        id="chatbot-messages-scroll"
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/40"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isWelcome = msg.id === 'welcome-msg';

          // Extract unique source document names
          const uniqueDocs = msg.sources
            ? Array.from(new Set(msg.sources.map((s) => s.documentName)))
            : [];

          return (
            <div
              key={msg.id}
              id={`chat-msg-${msg.id}`}
              className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                  isUser
                    ? 'bg-[#1A1715] text-amber-300 text-xs font-bold'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                {isUser ? (
                  (profile?.firstName || user?.email || 'U').charAt(0).toUpperCase()
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-700" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex flex-col max-w-[85%] sm:max-w-[75%] space-y-2 ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#1A1715] text-[#FAF8F5] rounded-tr-xs'
                      : 'bg-white border border-stone-200 text-stone-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Actions (Copy) */}
                  {!isUser && !isWelcome && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-stone-400 font-medium">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-md"
                        title="Copy answer"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Sources Citation Pills */}
                {!isUser && uniqueDocs.length > 0 && (
                  <div
                    id={`chat-sources-${msg.id}`}
                    className="flex flex-wrap items-center gap-1.5 px-1"
                  >
                    <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber-700" />
                      <span>Grounded by:</span>
                    </span>

                    {uniqueDocs.map((docName, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50/80 border border-amber-200 text-[10px] font-medium text-amber-950 shadow-2xs"
                      >
                        <FileText className="w-2.5 h-2.5 text-amber-700" />
                        <span className="truncate max-w-[170px]">{docName}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Streaming Response Bubble */}
        {isLoading && currentStreamResponse && (
          <div className="flex gap-3.5 flex-row">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-700" />
            </div>

            <div className="flex flex-col max-w-[85%] sm:max-w-[75%] space-y-2 items-start">
              <div className="rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs bg-white border border-stone-200 text-stone-800 rounded-tl-xs">
                <div className="whitespace-pre-wrap font-sans">
                  {currentStreamResponse}
                </div>
                <div className="mt-2 text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  <span>Generating grounded response...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator (Scanning & Retrieving) */}
        {isLoading && !currentStreamResponse && (
          <div className="flex gap-3.5 flex-row items-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-amber-700" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-2 text-xs text-stone-500">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                />
              </div>
              <span className="font-medium text-stone-600">
                Searching Knowledge Base chunks & consulting Gemini...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Suggested Questions */}
      <div className="px-6 py-2.5 bg-white border-t border-stone-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
          Suggested:
        </span>
        {SUGGESTED_QUESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(suggestion)}
            disabled={isLoading}
            className="text-[11px] bg-[#FAF8F5] hover:bg-amber-50 hover:border-amber-300 text-stone-600 hover:text-stone-900 px-3 py-1 rounded-full border border-stone-200 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* 4. Query Input & Send Action Bar */}
      <div
        id="chatbot-input-bar"
        className="p-4 bg-white border-t border-stone-200 shrink-0"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              id="chatbot-query-input"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything grounded in your Knowledge Base (Enter to send, Shift+Enter for newline)..."
              rows={2}
              disabled={isLoading}
              className="w-full p-3 text-xs sm:text-sm bg-[#FAF8F5] border border-stone-200 rounded-2xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none disabled:opacity-60"
            />
          </div>

          <button
            id="chatbot-send-button"
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="h-11 px-4 sm:px-5 bg-[#1A1715] hover:bg-[#2C2724] text-[#FAF8F5] rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 mt-2">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Answers strictly grounded in Knowledge Base</span>
          </div>
          <span>Gemini 3.8 Flash &bull; RAG Pipeline</span>
        </div>
      </div>
    </div>
  );
};
