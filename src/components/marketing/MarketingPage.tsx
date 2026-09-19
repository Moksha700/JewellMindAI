import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  SlidersHorizontal, 
  Eye, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Diamond, 
  Heart, 
  Star,
  Compass,
  Gift,
  Store,
  ExternalLink,
  BookOpen,
  FolderLock,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { KnowledgeBasePage } from '../knowledge/KnowledgeBasePage';
import { AiChatbot } from '../chat/AiChatbot';
import { ContactForm } from '../contact/ContactForm';

interface MarketingPageProps {
  onNavigateAuth: (tab: 'signin' | 'signup') => void;
  onNavigateDashboard?: () => void;
  onOpenQuickFeature?: (feature: string) => void;
}

export const MarketingPage: React.FC<MarketingPageProps> = ({ 
  onNavigateAuth,
  onNavigateDashboard,
  onOpenQuickFeature 
}) => {
  const { user, profile, signOut } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync hash routing for chatbot popup
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#chatbot' || window.location.hash === '#chat') {
        setIsChatOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1715] flex flex-col font-sans-clean selection:bg-amber-100 selection:text-amber-900">
      
      {/* 1. STICKY NAV */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EBE7DF] transition-all">
        <nav 
          id="main-navigation" 
          aria-label="Main Navigation"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between"
        >
          {/* Logo */}
          <a 
            href="#" 
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg p-1"
            aria-label="JewelMind AI Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1A1715] to-[#2E2A27] text-amber-300 flex items-center justify-center shadow-sm border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Diamond className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-serif-luxury text-2xl font-bold tracking-tight text-[#1A1715] block leading-none">
                JewelMind<span className="text-amber-600">.AI</span>
              </span>
              <span className="text-[10px] tracking-widest text-[#78716C] uppercase font-semibold">
                Haute Intelligence
              </span>
            </div>
          </a>

          {/* Primary Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#57534E]">
            {user && (
              <a 
                href="#knowledge-base" 
                className="text-amber-800 font-bold hover:text-[#1A1715] transition-colors py-1 flex items-center gap-1.5 focus:outline-none"
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Knowledge Base</span>
              </a>
            )}
            <a 
              href="#features" 
              className="hover:text-[#1A1715] transition-colors py-1 focus:outline-none focus:text-[#1A1715]"
            >
              Capabilities
            </a>
            <a 
              href="#outcomes" 
              className="hover:text-[#1A1715] transition-colors py-1 focus:outline-none focus:text-[#1A1715]"
            >
              Outcomes
            </a>
            <a 
              href="#how-it-works" 
              className="hover:text-[#1A1715] transition-colors py-1 focus:outline-none focus:text-[#1A1715]"
            >
              How It Works
            </a>
            <a 
              href="#faq" 
              className="hover:text-[#1A1715] transition-colors py-1 focus:outline-none focus:text-[#1A1715]"
            >
              FAQ
            </a>
            <a 
              href="#contact" 
              className="hover:text-[#1A1715] transition-colors py-1 focus:outline-none focus:text-[#1A1715]"
            >
              Contact
            </a>
          </div>

          {/* CTA Group */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  id="user-profile-menu-button"
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-xs font-semibold text-stone-800 bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 px-2.5 sm:px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  title="User Account Menu"
                >
                  <div className="w-6 h-6 rounded-full bg-stone-900 text-amber-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {(profile?.firstName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[100px] sm:max-w-[130px]">
                    {profile?.firstName || user.displayName || user.email}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-150 ${
                      profileDropdownOpen ? 'rotate-180 text-stone-700' : ''
                    }`}
                  />
                </button>

                {profileDropdownOpen && (
                  <div
                    id="user-profile-dropdown"
                    className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-stone-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="px-3.5 py-2 border-b border-stone-100">
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Signed In</p>
                      <p className="text-xs font-semibold text-stone-900 truncate mt-0.5">
                        {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user.email}
                      </p>
                    </div>

                    <button
                      id="dropdown-dashboard-button"
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        if (onNavigateDashboard) {
                          onNavigateDashboard();
                        } else {
                          window.location.hash = 'dashboard';
                        }
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-stone-700 hover:bg-amber-50/60 hover:text-amber-950 flex items-center gap-2.5 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <FolderLock className="w-4 h-4 text-amber-600" />
                      <span>Dashboard</span>
                    </button>

                    <div className="border-t border-stone-100 my-1" />

                    <button
                      id="dropdown-signout-button"
                      type="button"
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await signOut();
                        window.location.hash = '';
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  id="nav-signin-button"
                  onClick={() => onNavigateAuth('signin')}
                  className="text-sm font-semibold text-[#57534E] hover:text-[#1A1715] px-3.5 py-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="nav-getstarted-button"
                  onClick={() => onNavigateAuth('signup')}
                  className="text-sm font-semibold bg-[#1A1715] text-[#FAF8F5] hover:bg-[#2C2724] px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        
        {/* 2. HERO SECTION */}
        <section 
          id="hero-section" 
          aria-labelledby="hero-heading"
          className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-[#EBE7DF]"
        >
          {/* Subtle background glow */}
          <div 
            className="absolute top-0 right-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" 
            aria-hidden="true" 
          />
          <div 
            className="absolute bottom-10 left-10 w-72 h-72 bg-stone-200/40 rounded-full blur-2xl pointer-events-none -z-10" 
            aria-hidden="true" 
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Headlines & CTAs */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                
                {/* Micro badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold tracking-wide shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>The Gemological Styling AI Engine</span>
                </div>

                {/* Single H1 on Page */}
                <h1 
                  id="hero-heading"
                  className="font-serif-luxury text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold text-[#1A1715] tracking-tight leading-[1.08]"
                >
                  Your AI for perfect jewellery.
                </h1>

                {/* Sub-headline */}
                <p className="text-lg sm:text-xl text-[#57534E] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Struggling to match pieces with specific dresses, galas, or milestone moments? 
                  JewelMind AI eliminates decision paralysis for <strong className="font-semibold text-[#1A1715]">individual buyers</strong>, <strong className="font-semibold text-[#1A1715]">gift-givers</strong>, and <strong className="font-semibold text-[#1A1715]">boutique jewellery studios</strong> with bespoke style diagnostics and realistic virtual try-on.
                </p>

                {/* CTA Group */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button
                    id="hero-primary-cta"
                    onClick={() => onNavigateAuth('signup')}
                    className="w-full sm:w-auto px-8 py-4 bg-[#1A1715] text-[#FAF8F5] font-semibold text-base rounded-2xl hover:bg-[#2E2825] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600"
                  >
                    <span>Start Free Style Match</span>
                    <ArrowRight className="w-5 h-5 text-amber-400" />
                  </button>
                  <button
                    id="hero-secondary-cta"
                    onClick={() => {
                      const el = document.getElementById('features');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto px-7 py-4 bg-white text-[#292524] font-semibold text-base rounded-2xl border border-[#D6D3CD] hover:border-[#1A1715] hover:bg-[#F5F2EC] shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <Eye className="w-4 h-4 text-[#78716C]" />
                    <span>Explore Virtual Try-On</span>
                  </button>
                </div>

                {/* Audience endorsement pill tags */}
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs font-medium text-[#78716C]">
                  <span className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-stone-100 border border-stone-200">
                    <Compass className="w-3.5 h-3.5 text-amber-700" />
                    Individual Buyers
                  </span>
                  <span className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-stone-100 border border-stone-200">
                    <Gift className="w-3.5 h-3.5 text-amber-700" />
                    Thoughtful Gift-Givers
                  </span>
                  <span className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-stone-100 border border-stone-200">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                    Independent Jewellery Studios
                  </span>
                </div>
              </div>

              {/* Right Column: Supporting Visual Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Decorative backdrop border */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/40 via-stone-200/40 to-amber-100/40 rounded-3xl transform rotate-2 scale-102" />
                  
                  {/* Main Visual Presentation Card */}
                  <div className="relative bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E2D8] shadow-xl space-y-5">
                    
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Real-time AI Match
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        98% Harmony Score
                      </span>
                    </div>

                    {/* Featured Visual Image with Alt Text */}
                    <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 group">
                      <img
                        src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80"
                        alt="Solitaire Emerald Cut Diamond Pendant necklace with warm gold chain on silk fabric"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute bottom-3 left-3 right-3 bg-stone-900/85 backdrop-blur-md rounded-xl p-3 text-white flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-amber-300">Curated For: Black Tie Gala</p>
                          <p className="text-sm font-serif-luxury font-bold">Aethel Emerald Cut Solitaire</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-stone-300">Harmonized Metal</span>
                          <p className="text-xs font-semibold text-white">18k Warm Gold</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning Insights */}
                    <div className="space-y-2 pt-1 text-xs text-stone-600 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EBE7DF]">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Neckline Calibration:</strong> 18-inch drop harmonizes with sweetheart and deep-V gala dresses.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Skin Tone Synergy:</strong> Yellow gold warm tones complement golden and neutral undertones.</span>
                      </div>
                    </div>

                    {/* Action preview */}
                    <button
                      onClick={() => onNavigateAuth('signup')}
                      className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-[#1A1715] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Try this look in Virtual Try-On</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* KNOWLEDGE BASE SECTION: Visible ONLY on Home page for authenticated users */}
        {user && (
          <section 
            id="knowledge-base" 
            aria-labelledby="knowledge-base-heading"
            className="py-14 md:py-20 bg-white border-b border-[#EBE7DF]"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <KnowledgeBasePage />
            </div>
          </section>
        )}

        {/* 3. FEATURE GRID (3 CARDS): Style Quiz, Occasion Filters, Virtual Try-On */}
        <section 
          id="features" 
          aria-labelledby="features-heading"
          className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#EBE7DF]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Core Capabilities
              </span>
              <h2 
                id="features-heading"
                className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1715]"
              >
                Engineered for flawless jewellery decisions.
              </h2>
              <p className="text-base sm:text-lg text-[#57534E]">
                Traditional jewellery shopping forces you to guess how a piece will look or feel with your wardrobe. 
                Our three-pillar AI architecture brings precision to every touchpoint.
              </p>
            </div>

            {/* 3 Featured Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Card 1: Style Quiz */}
              <div 
                id="feature-card-quiz"
                className="bg-white rounded-3xl p-8 border border-[#E7E2D8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 group-hover:scale-105 transition-transform">
                    <SlidersHorizontal className="w-7 h-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif-luxury text-2xl font-bold text-[#1A1715]">
                      Style Quiz
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      A personalized diagnostic analyzing your aesthetic preferences, metal warmth (18k gold, platinum, rose), gemstone inclinations, and lifestyle durability needs.
                    </p>
                  </div>

                  {/* Visual micro-demonstration */}
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE7DF] space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-stone-500">
                      <span>Quiz Step 2 of 5</span>
                      <span className="font-semibold text-amber-700">Aesthetic Mood</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                        Art Deco
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white text-stone-600 border border-stone-200">
                        Minimalist
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white text-stone-600 border border-stone-200">
                        Royal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100 mt-6">
                  <button
                    onClick={() => onNavigateAuth('signup')}
                    className="text-sm font-bold text-[#1A1715] group-hover:text-amber-700 flex items-center gap-1.5 transition-colors focus:outline-none"
                  >
                    <span>Launch AI Style Quiz</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card 2: Occasion Filters */}
              <div 
                id="feature-card-occasions"
                className="bg-white rounded-3xl p-8 border border-[#E7E2D8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-[#1A1715] group-hover:scale-105 transition-transform">
                    <Layers className="w-7 h-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif-luxury text-2xl font-bold text-[#1A1715]">
                      Occasion Filters
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      Filter by dress code formality, neckline geometry, and lighting conditions. Whether it's a wedding altar, black-tie charity dinner, or curated everyday stack.
                    </p>
                  </div>

                  {/* Visual micro-demonstration */}
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE7DF] space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-stone-500">
                      <span>Occasion Matching</span>
                      <span className="font-semibold text-stone-800">Dynamic Hierarchy</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded-lg bg-stone-200 text-stone-800 font-medium">Wedding Gala</span>
                      <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium">Anniversary</span>
                      <span className="px-2 py-1 rounded-lg bg-stone-100 text-stone-600 font-medium">Cocktail</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100 mt-6">
                  <button
                    onClick={() => onNavigateAuth('signup')}
                    className="text-sm font-bold text-[#1A1715] group-hover:text-amber-700 flex items-center gap-1.5 transition-colors focus:outline-none"
                  >
                    <span>Filter By Occasion</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card 3: Virtual Try-On */}
              <div 
                id="feature-card-tryon"
                className="bg-white rounded-3xl p-8 border border-[#E7E2D8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 group-hover:scale-105 transition-transform">
                    <Eye className="w-7 h-7" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-serif-luxury text-2xl font-bold text-[#1A1715]">
                      Virtual Try-On
                    </h3>
                    <p className="text-sm text-[#57534E] leading-relaxed">
                      Visualize necklaces, drop earrings, and solitaire rings on realistic digital necklines, earlobes, and hands. Fine-tune scale, metal luster, and lighting reflection.
                    </p>
                  </div>

                  {/* Visual micro-demonstration */}
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE7DF] space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-stone-500">
                      <span>Studio Canvas</span>
                      <span className="font-semibold text-emerald-700">Sub-mm Precision</span>
                    </div>
                    <div className="h-6 rounded-lg bg-stone-200/70 relative overflow-hidden flex items-center px-3">
                      <div className="h-1.5 bg-amber-600 rounded-full w-3/4" />
                      <span className="absolute right-2 text-[10px] text-stone-600 font-mono">18k Yellow Gold</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100 mt-6">
                  <button
                    onClick={() => onNavigateAuth('signup')}
                    className="text-sm font-bold text-[#1A1715] group-hover:text-amber-700 flex items-center gap-1.5 transition-colors focus:outline-none"
                  >
                    <span>Launch Try-On Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 4. SOCIAL PROOF / OUTCOMES BAND */}
        <section 
          id="outcomes" 
          aria-labelledby="outcomes-heading"
          className="py-20 bg-[#1A1715] text-[#FAF8F5] border-b border-stone-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-16 border-b border-stone-800 text-center">
              <div className="space-y-2">
                <p className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300">
                  94%
                </p>
                <p className="text-xs sm:text-sm text-stone-400 font-medium">
                  Lower Return Rate on Pieces
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300">
                  3.2x
                </p>
                <p className="text-xs sm:text-sm text-stone-400 font-medium">
                  Faster Gift Decision Speed
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300">
                  52,000+
                </p>
                <p className="text-xs sm:text-sm text-stone-400 font-medium">
                  Pieces Harmonized to Date
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300">
                  4.9 / 5
                </p>
                <p className="text-xs sm:text-sm text-stone-400 font-medium">
                  Buyer & Jeweller Satisfaction
                </p>
              </div>
            </div>

            {/* Testimonials */}
            <div className="pt-16">
              <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                <h2 
                  id="outcomes-heading"
                  className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white"
                >
                  Loved by individual buyers, gift-givers, and fine jewellers.
                </h2>
                <p className="text-sm text-stone-400">
                  Real stories from clients who replaced endless guesswork with AI confidence.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Individual Buyer */}
                <div className="bg-stone-900/80 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed italic">
                    "I bought a high-neck velvet evening dress for a winter wedding and was paralyzed over whether to wear earrings or a statement collar. JewelMind suggested drops in yellow gold that pulled the entire look together perfectly."
                  </p>
                  <div>
                    <p className="text-sm font-bold text-white">Elena Vance</p>
                    <p className="text-xs text-stone-400">Individual Buyer • London</p>
                  </div>
                </div>

                {/* Gift-Giver */}
                <div className="bg-stone-900/80 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed italic">
                    "Finding a 10th anniversary gift that matched my wife's understated aesthetic used to terrify me. The style quiz zeroed in on an emerald cut sapphire band she hasn't taken off since our celebration."
                  </p>
                  <div>
                    <p className="text-sm font-bold text-white">Marcus Sterling</p>
                    <p className="text-xs text-stone-400">Gift-Giver • San Francisco</p>
                  </div>
                </div>

                {/* Small Jewellery Business */}
                <div className="bg-stone-900/80 p-6 rounded-2xl border border-stone-800 space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed italic">
                    "As a boutique atelier with handmade pieces, JewelMind AI gives our clients bespoke consultation grade advice right on our website. Our custom commission close-rate jumped by 40%."
                  </p>
                  <div>
                    <p className="text-sm font-bold text-white">Clara Fontaine</p>
                    <p className="text-xs text-stone-400">Founder, Atelier Fontaine Jewellery</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* 5. HOW IT WORKS (3 STEPS) */}
        <section 
          id="how-it-works" 
          aria-labelledby="how-heading"
          className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#EBE7DF]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Simple 3-Step Process
              </span>
              <h2 
                id="how-heading"
                className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1715]"
              >
                From wardrobe dilemma to effortless poise.
              </h2>
              <p className="text-base sm:text-lg text-[#57534E]">
                Three intuitive steps designed to replace hesitation with curated certainty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-8 border border-[#E7E2D8] shadow-xs relative space-y-6">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-[#1A1715] text-amber-300 font-serif-luxury text-xl font-bold flex items-center justify-center">
                    01
                  </span>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Input Profile
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#1A1715]">
                    Share Mood & Occasion
                  </h3>
                  <p className="text-sm text-[#57534E] leading-relaxed">
                    Answer 4 swift style questions or specify your event (wedding, gala, anniversary, or everyday) along with preferred metals, dress neckline, and budget boundaries.
                  </p>
                </div>
                <div className="pt-2 text-xs font-medium text-amber-800 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
                  Takes less than 90 seconds
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-8 border border-[#E7E2D8] shadow-xs relative space-y-6">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-[#1A1715] text-amber-300 font-serif-luxury text-xl font-bold flex items-center justify-center">
                    02
                  </span>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    AI Harmonization
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#1A1715]">
                    Harmonize & Try On
                  </h3>
                  <p className="text-sm text-[#57534E] leading-relaxed">
                    JewelMind AI calculates aesthetic symmetry, stone balance, and metal warmth. Launch Virtual Try-On to test items directly on lifelike necklines, ears, and hands.
                  </p>
                </div>
                <div className="pt-2 text-xs font-medium text-emerald-800 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
                  Dynamic scale & luster preview
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl p-8 border border-[#E7E2D8] shadow-xs relative space-y-6">
                <div className="flex items-center justify-between">
                  <span className="w-12 h-12 rounded-2xl bg-[#1A1715] text-amber-300 font-serif-luxury text-xl font-bold flex items-center justify-center">
                    03
                  </span>
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                    Save & Acquire
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif-luxury text-2xl font-bold text-[#1A1715]">
                    Save, Share, or Commission
                  </h3>
                  <p className="text-sm text-[#57534E] leading-relaxed">
                    Archive your recommendations to your personal vault, export specifications to share with your custom jeweller, or explore certified gemstone partners.
                  </p>
                </div>
                <div className="pt-2 text-xs font-medium text-stone-800 bg-stone-100 p-3 rounded-xl border border-stone-200">
                  Real-time synchronization
                </div>
              </div>

            </div>

            {/* Bottom CTA within How it Works */}
            <div className="mt-14 text-center">
              <button
                onClick={() => onNavigateAuth('signup')}
                className="px-8 py-4 bg-[#1A1715] text-white font-semibold text-base rounded-2xl hover:bg-[#2C2724] shadow-md transition-all inline-flex items-center gap-2"
              >
                <span>Experience JewelMind AI Now</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>

          </div>
        </section>

        {/* 6. FAQ (5 QUESTIONS) */}
        <section 
          id="faq" 
          aria-labelledby="faq-heading"
          className="py-20 md:py-28 bg-white border-b border-[#EBE7DF]"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Frequently Asked Questions
              </span>
              <h2 
                id="faq-heading"
                className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1715]"
              >
                Everything you need to know.
              </h2>
              <p className="text-base text-[#57534E]">
                Answers to common questions from individual collectors, gift-seekers, and studio owners.
              </p>
            </div>

            {/* 5 FAQ Items in Accordion */}
            <div className="space-y-4">
              
              {/* FAQ 1 */}
              <div className="border border-[#E7E2D8] rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => toggleFaq(0)}
                  aria-expanded={openFaq === 0}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif-luxury text-xl font-bold text-[#1A1715] hover:text-amber-800 transition-colors focus:outline-none"
                >
                  <span>1. How does JewelMind AI accurately match jewellery to specific outfits or skin undertones?</span>
                  {openFaq === 0 ? (
                    <ChevronUp className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                  )}
                </button>
                {openFaq === 0 && (
                  <div className="px-6 pb-6 text-sm text-[#57534E] leading-relaxed border-t border-stone-100 pt-4">
                    JewelMind AI combines classical gemological color theory with modern computer vision principles. 
                    It maps collar geometry (e.g. sweetheart, halter, boatneck) to proportional necklace drop lengths, and balances skin warmth against metal compositions (warm 18k yellow gold vs cool platinum/white gold vs neutral rose gold).
                  </div>
                )}
              </div>

              {/* FAQ 2 */}
              <div className="border border-[#E7E2D8] rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => toggleFaq(1)}
                  aria-expanded={openFaq === 1}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif-luxury text-xl font-bold text-[#1A1715] hover:text-amber-800 transition-colors focus:outline-none"
                >
                  <span>2. Can small jewellery businesses and independent designers integrate JewelMind AI?</span>
                  {openFaq === 1}
                  {openFaq === 1 ? (
                    <ChevronUp className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                  )}
                </button>
                {openFaq === 1 && (
                  <div className="px-6 pb-6 text-sm text-[#57534E] leading-relaxed border-t border-stone-100 pt-4">
                    Yes! Independent designers and boutique studios use JewelMind AI to curate personalized recommendations for their client books, reduce return rates, and offer virtual try-ons without requiring expensive physical sample shipping.
                  </div>
                )}
              </div>

              {/* FAQ 3 */}
              <div className="border border-[#E7E2D8] rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => toggleFaq(2)}
                  aria-expanded={openFaq === 2}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif-luxury text-xl font-bold text-[#1A1715] hover:text-amber-800 transition-colors focus:outline-none"
                >
                  <span>3. What if I'm purchasing a gift and don't know the recipient's exact size or aesthetic?</span>
                  {openFaq === 2 ? (
                    <ChevronUp className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                  )}
                </button>
                {openFaq === 2 && (
                  <div className="px-6 pb-6 text-sm text-[#57534E] leading-relaxed border-t border-stone-100 pt-4">
                    Our Gift-Giver Mode allows you to input their everyday clothing style, favorite metal color, and the milestone occasion. 
                    It prioritizes universally flattering, sizing-flexible items (such as adjustable tennis bracelets, pendant necklaces, and huggie earrings) with a 98% gift recipient satisfaction guarantee.
                  </div>
                )}
              </div>

              {/* FAQ 4 */}
              <div className="border border-[#E7E2D8] rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => toggleFaq(3)}
                  aria-expanded={openFaq === 3}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif-luxury text-xl font-bold text-[#1A1715] hover:text-amber-800 transition-colors focus:outline-none"
                >
                  <span>4. How does the Virtual Try-On accurately model scale, carat weight, and metal luster?</span>
                  {openFaq === 3 ? (
                    <ChevronUp className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                  )}
                </button>
                {openFaq === 3 && (
                  <div className="px-6 pb-6 text-sm text-[#57534E] leading-relaxed border-t border-stone-100 pt-4">
                    Our Virtual Try-On studio renders pieces using calibrated mm-to-pixel aspect ratios across standard collarbones, earlobes, and finger proportions. 
                    You can scale pieces, adjust specular shine between high-polish gold and frosted platinum, and test stacking layers.
                  </div>
                )}
              </div>

              {/* FAQ 5 */}
              <div className="border border-[#E7E2D8] rounded-2xl overflow-hidden transition-colors">
                <button
                  onClick={() => toggleFaq(4)}
                  aria-expanded={openFaq === 4}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-serif-luxury text-xl font-bold text-[#1A1715] hover:text-amber-800 transition-colors focus:outline-none"
                >
                  <span>5. Is JewelMind AI free to use for individual shoppers?</span>
                  {openFaq === 4 ? (
                    <ChevronUp className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                  )}
                </button>
                {openFaq === 4 && (
                  <div className="px-6 pb-6 text-sm text-[#57534E] leading-relaxed border-t border-stone-100 pt-4">
                    Yes! Individual jewellery lovers and gift-givers can create a free account, complete unlimited style quizzes, test virtual try-ons, and store their favorite pieces in their personal private vault.
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* 6. CONTACT CONCIERGE FORM SECTION */}
        <section id="contact" className="py-20 bg-[#F4EFE6] border-t border-[#E8E2D5]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <ContactForm source="marketing_landing_page" />
          </div>
        </section>

      </main>

      {/* 7. FOOTER WITH LEGAL LINKS */}
      <footer className="bg-[#141210] text-[#A8A29E] text-xs border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
            
            {/* Col 1: Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-bold">
                  <Diamond className="w-4 h-4" />
                </div>
                <span className="font-serif-luxury text-xl font-bold text-white tracking-wide">
                  JewelMind<span className="text-amber-400">.AI</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Your AI for perfect jewellery. Empowering individual buyers, gift-givers, and boutique designers with personalized styling intelligence.
              </p>
            </div>

            {/* Col 2: Platform */}
            <div className="space-y-3">
              <p className="text-white font-semibold uppercase tracking-wider text-[11px]">Platform</p>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Style Quiz</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Occasion Filters</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Virtual Try-On</a></li>
                <li><a href="#outcomes" className="hover:text-white transition-colors">Client Outcomes</a></li>
              </ul>
            </div>

            {/* Col 3: Audiences */}
            <div className="space-y-3">
              <p className="text-white font-semibold uppercase tracking-wider text-[11px]">Solutions</p>
              <ul className="space-y-2">
                <li><a href="#hero-section" className="hover:text-white transition-colors">Individual Buyers</a></li>
                <li><a href="#hero-section" className="hover:text-white transition-colors">Gift-Givers</a></li>
                <li><a href="#hero-section" className="hover:text-white transition-colors">Boutique Jewellers</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Custom Commissions</a></li>
              </ul>
            </div>

            {/* Col 4: Legal Links */}
            <div className="space-y-3">
              <p className="text-white font-semibold uppercase tracking-wider text-[11px]">Legal & Ethics</p>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ethical Gemstone Sourcing Statement</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security & Data Protection</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Preferences</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom attribution */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500">
            <p>© {new Date().getFullYear()} JewelMind AI, Inc. All rights reserved. Crafted with Haute Intelligence.</p>
            <p className="text-[11px]">Protected by Firebase Cloud ABAC security & RLS policies.</p>
          </div>
        </div>
      </footer>

      {/* FLOATING AI CHATBOT (Bottom-Right corner) */}
      <div id="floating-ai-chatbot-root">
        {/* Floating Chat Panel Popup (Above button, stays in viewport) */}
        {isChatOpen && (
          <div
            id="floating-ai-chatbot-panel"
            role="dialog"
            aria-label="AI Chatbot Assistant"
            className="fixed bottom-20 right-4 sm:bottom-22 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] md:w-[470px] max-w-[95vw] h-[580px] max-h-[calc(100vh-6.5rem)] shadow-2xl rounded-3xl overflow-hidden border border-stone-200 bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <AiChatbot
              isFloating={true}
              onClose={() => setIsChatOpen(false)}
              onNavigateToKnowledgeBase={() => {
                setIsChatOpen(false);
                const el = document.getElementById('knowledge-base');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.hash = 'knowledge-base';
                }
              }}
            />
          </div>
        )}

        {/* Floating Trigger Button (Fixed to bottom-right corner) */}
        <button
          id="floating-ai-chatbot-button"
          type="button"
          onClick={() => setIsChatOpen((prev) => !prev)}
          className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 group flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 select-none ${
            isChatOpen
              ? 'bg-[#1A1715] text-[#FAF8F5] border-amber-400/60 shadow-amber-950/30'
              : 'bg-[#1A1715] text-[#FAF8F5] hover:bg-[#2C2724] border-amber-500/40 hover:border-amber-400'
          }`}
          aria-expanded={isChatOpen}
          aria-haspopup="dialog"
          aria-label={isChatOpen ? 'Close AI Chatbot' : 'Open AI Chatbot'}
          title={isChatOpen ? 'Close AI Chatbot' : 'Open AI Chatbot (RAG Grounded)'}
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#1A1715] animate-pulse" />
          </div>
          <span className="text-xs font-bold text-amber-100 tracking-wide font-sans-clean">
            {isChatOpen ? 'Close AI Chat' : 'AI Chatbot'}
          </span>
        </button>
      </div>

    </div>
  );
};
