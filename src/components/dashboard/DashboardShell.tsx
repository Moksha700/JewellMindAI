import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { JewelleryCatalogItem, JewelleryRecordDoc } from '../../types';
import { subscribeToUserRecords } from '../../services/recordsService';
import { 
  Diamond, 
  Sparkles, 
  Layers, 
  Eye, 
  Compass, 
  Heart, 
  FolderLock, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldCheck, 
  User,
  Plus,
  MessageSquare,
  History,
  Home
} from 'lucide-react';
import { DashboardOverview } from './DashboardOverview';
import { OccasionFiltersView } from './OccasionFiltersView';
import { VirtualTryOnStudio } from './VirtualTryOnStudio';
import { RecommendationEngineView } from './RecommendationEngineView';
import { StyleQuizModal } from './StyleQuizModal';
import { StyleQuizManager } from '../style-quiz/StyleQuizManager';
import { HeroAiStudio } from '../ai/HeroAiStudio';
import { AiHistoryPage } from '../history/AiHistoryPage';
import { ContactModal } from '../contact/ContactModal';
import { SettingsModal } from './SettingsModal';
import { RecordDetailsModal } from './RecordDetailsModal';
import { AiChatbot } from '../chat/AiChatbot';

export const DashboardShell: React.FC = () => {
  const { user, profile, role, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hero_ai' | 'ai_chat' | 'ai_history' | 'style_quiz' | 'occasions' | 'tryon' | 'recommendations' | 'favorites'
  >('overview');

  const [rerunState, setRerunState] = useState<{
    prompt: string;
    capability?: any;
    model?: string;
  } | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<JewelleryRecordDoc | null>(null);
  const [tryOnItem, setTryOnItem] = useState<JewelleryCatalogItem | null>(null);

  // Real-time records from Firestore (scoped strictly to auth.uid())
  const [records, setRecords] = useState<JewelleryRecordDoc[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoadingRecords(true);

    // Subscribe to Firestore changes scoped to auth.uid() via RLS
    const unsubscribe = subscribeToUserRecords(
      user.uid,
      (updatedRecords) => {
        setRecords(updatedRecords);
        setLoadingRecords(false);
      },
      (err) => {
        console.warn('Subscription error on records:', err);
        setLoadingRecords(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLaunchTryOnWithItem = (item: JewelleryCatalogItem) => {
    setTryOnItem(item);
    setActiveTab('tryon');
  };

  const handleRerunPrompt = (prompt: string, capability?: any, model?: string) => {
    setRerunState({ prompt, capability, model });
    setActiveTab('hero_ai');
  };

  const navItems = [
    { id: 'overview', label: 'Vault Overview', icon: FolderLock },
    { id: 'ai_chat', label: 'Knowledge Chatbot', icon: MessageSquare },
    { id: 'hero_ai', label: 'Haute AI Studio', icon: Sparkles },
    { id: 'ai_history', label: 'AI History', icon: History },
    { id: 'style_quiz', label: 'Style Quiz', icon: Compass },
    { id: 'occasions', label: 'Occasion Filters', icon: Layers },
    { id: 'tryon', label: 'Virtual Try-On', icon: Eye },
    { id: 'recommendations', label: 'Recommendation Engine', icon: Sparkles },
    { id: 'favorites', label: 'Saved Favorites', icon: Heart },
  ];

  const firstName = profile?.firstName || 'Collector';
  const fullName = `${profile?.firstName || 'Collector'} ${profile?.lastName || ''}`.trim();
  const userRole = role || 'user';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1715] flex font-sans-clean">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (Collapsible on Mobile) */}
      <aside
        id="app-sidebar"
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 bg-white border-r border-[#E7E2D8] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '';
            }}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            title="Return to Home"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1A1715] text-amber-300 flex items-center justify-center shadow-xs border border-amber-500/20">
              <Diamond className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-serif-luxury text-xl font-bold text-stone-900 block leading-tight">
                JewelMind<span className="text-amber-600">.AI</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block">
                Atelier Suite
              </span>
            </div>
          </a>
          
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: Launch Style Quiz */}
        <div className="px-4 pt-4">
          <button
            id="sidebar-launch-quiz-button"
            onClick={() => {
              setQuizModalOpen(true);
              setSidebarOpen(false);
            }}
            className="w-full py-2.5 px-3 bg-[#1A1715] hover:bg-[#2A2522] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Style Quiz</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Sidebar Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/80 shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-stone-100 bg-[#FAF8F5]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                {firstName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">{fullName}</p>
                <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR WITH USER MENU */}
        <header className="sticky top-0 z-30 h-16 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E7E2D8] flex items-center justify-between px-4 sm:px-8">
          
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              id="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-200/50"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span className="hidden sm:inline">JewelMind AI</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-bold text-stone-900 capitalize">
                {activeTab === 'overview'
                  ? 'Vault Overview'
                  : activeTab === 'hero_ai'
                  ? 'Haute AI Studio'
                  : activeTab === 'ai_history'
                  ? 'AI History'
                  : activeTab === 'style_quiz'
                  ? 'Style Quiz'
                  : activeTab === 'occasions'
                  ? 'Occasion Filters'
                  : activeTab === 'tryon'
                  ? 'Virtual Try-On'
                  : activeTab === 'recommendations'
                  ? 'Recommendation Engine'
                  : 'Saved Favorites'}
              </span>
            </div>
          </div>

          {/* Right: Home, Contact Button & User Menu Dropdown */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                window.location.hash = '';
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Return to Home Page"
            >
              <Home className="w-3.5 h-3.5 text-amber-600" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setContactModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Contact Haute Concierge"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Concierge Inquiries</span>
            </button>

            <div className="relative">
              <button
                id="topbar-user-menu-button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-200/50 transition-colors focus:outline-none cursor-pointer"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-stone-900 text-amber-300 text-xs font-bold flex items-center justify-center">
                  {firstName.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-stone-800 hidden sm:inline">
                  {firstName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)} 
                  />
                  <div 
                    role="menu"
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-xl py-2 z-50 text-xs"
                  >
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900">{fullName}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <ShieldCheck className="w-3 h-3 text-amber-700" />
                        <span>Role: {userRole}</span>
                      </div>
                    </div>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        window.location.hash = '';
                      }}
                      className="w-full px-4 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Home className="w-3.5 h-3.5 text-amber-600" />
                      <span>Return to Home</span>
                    </button>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setContactModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Contact Concierge</span>
                    </button>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setSettingsModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-stone-400" />
                      <span>Account Settings</span>
                    </button>

                    <div className="border-t border-stone-100 my-1" />

                    <button
                      role="menuitem"
                      onClick={async () => {
                        setUserDropdownOpen(false);
                        await signOut();
                        window.location.hash = '';
                      }}
                      className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </header>

        {/* WORKSPACE BODY */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              records={records}
              loadingRecords={loadingRecords}
              onOpenQuiz={() => setActiveTab('style_quiz')}
              onOpenOccasions={() => setActiveTab('occasions')}
              onOpenTryOn={() => setActiveTab('tryon')}
              onOpenRecommendations={() => setActiveTab('recommendations')}
              onOpenSettings={() => setSettingsModalOpen(true)}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onNavigateTab={(tabId) => setActiveTab(tabId as any)}
            />
          )}

          {activeTab === 'ai_chat' && (
            <div className="space-y-6">
              <AiChatbot
                onNavigateToKnowledgeBase={() => {
                  window.location.hash = 'knowledge-base';
                }}
              />
            </div>
          )}

          {activeTab === 'hero_ai' && (
            <HeroAiStudio
              initialPrompt={rerunState?.prompt}
              initialCapability={rerunState?.capability}
              initialModel={rerunState?.model}
              onNavigateToHistory={() => setActiveTab('ai_history')}
            />
          )}

          {activeTab === 'ai_history' && (
            <AiHistoryPage
              onRerunPrompt={handleRerunPrompt}
              onNavigateToStudio={() => setActiveTab('hero_ai')}
            />
          )}

          {activeTab === 'style_quiz' && (
            <StyleQuizManager />
          )}

          {activeTab === 'occasions' && (
            <OccasionFiltersView
              onSelectForTryOn={handleLaunchTryOnWithItem}
              onRecordSaved={() => {}}
            />
          )}

          {activeTab === 'tryon' && (
            <VirtualTryOnStudio
              initialItem={tryOnItem}
              onRecordSaved={() => {}}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationEngineView
              onSelectForTryOn={handleLaunchTryOnWithItem}
              onRecordSaved={() => {}}
            />
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
                    Saved Favorites & Wishlist
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Your bookmarked fine jewellery pieces with custom notes and price quotes.
                  </p>
                </div>
              </div>
              <DashboardOverview
                records={records.filter((r) => r.category === 'Saved Favorites')}
                loadingRecords={loadingRecords}
                onOpenQuiz={() => setQuizModalOpen(true)}
                onOpenOccasions={() => setActiveTab('occasions')}
                onOpenTryOn={() => setActiveTab('tryon')}
                onOpenRecommendations={() => setActiveTab('recommendations')}
                onOpenSettings={() => setSettingsModalOpen(true)}
                onSelectRecord={(rec) => setSelectedRecord(rec)}
                onNavigateTab={(tabId) => setActiveTab(tabId as any)}
              />
            </div>
          )}
        </main>

      </div>

      {/* Global Modals */}
      <StyleQuizModal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        onRecordSaved={() => {}}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <RecordDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onRecordUpdated={() => {}}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        source="dashboard_concierge"
      />

    </div>
  );
};
