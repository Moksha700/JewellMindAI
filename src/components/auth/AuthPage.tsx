import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Diamond, Lock, Mail, User as UserIcon, ArrowLeft, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  initialTab?: 'signin' | 'signup';
  onNavigateHome: () => void;
  onSuccessRedirect: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialTab = 'signin',
  onNavigateHome,
  onSuccessRedirect,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp, signInWithGoogle, user } = useAuth();

  // Sync tab whenever initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  // If already signed in, redirect immediately away from /auth
  React.useEffect(() => {
    if (user) {
      onSuccessRedirect();
    }
  }, [user, onSuccessRedirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      if (tab === 'signin') {
        const ok = await signIn(email.trim(), password);
        if (ok) {
          onSuccessRedirect();
        }
      } else {
        const ok = await signUp(
          email.trim(), 
          password, 
          firstName.trim() || 'Jewellery Lover', 
          lastName.trim()
        );
        if (ok) {
          onSuccessRedirect();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setSubmitting(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) {
        onSuccessRedirect();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setSubmitting(true);
    try {
      const demoEmail = 'guest.collector@jewelmind.ai';
      const demoPass = 'GemMaster2026!';
      
      // Try sign in, if not exists yet, create it automatically!
      const ok = await signIn(demoEmail, demoPass);
      if (ok) {
        onSuccessRedirect();
      } else {
        // Create demo account on the fly
        const created = await signUp(demoEmail, demoPass, 'Camille', 'Laurent');
        if (created) {
          onSuccessRedirect();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans-clean selection:bg-amber-100">
      
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6">
        <button
          id="auth-back-home-button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors p-2 rounded-xl hover:bg-stone-200/50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1A1715] text-amber-300 flex items-center justify-center shadow-md border border-amber-500/20">
          <Diamond className="w-6 h-6 text-amber-300" />
        </div>
        <h2 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-[#1A1715] tracking-tight">
          JewelMind AI
        </h2>
        <p className="text-sm text-stone-500 font-medium">
          {tab === 'signin' 
            ? 'Access your private jewellery vault & AI consultations' 
            : 'Create your private bespoke jewellery profile'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E7E2D8] shadow-lg space-y-5">

          {/* Continue with Google */}
          <button
            id="auth-google-signin-button"
            type="button"
            onClick={handleGoogleAuth}
            disabled={submitting}
            className="w-full py-3 px-4 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-semibold text-sm rounded-2xl border-2 border-stone-200 hover:border-stone-400 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-3 text-stone-400 font-medium">Or continue with Email</span>
            </div>
          </div>
          
          {/* Tab Switcher */}
          <div 
            role="tablist" 
            aria-label="Authentication Type"
            className="flex rounded-xl bg-stone-100 p-1 border border-stone-200"
          >
            <button
              id="auth-tab-signin"
              role="tab"
              aria-selected={tab === 'signin'}
              type="button"
              onClick={() => setTab('signin')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              role="tab"
              aria-selected={tab === 'signup'}
              type="button"
              onClick={() => setTab('signup')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {tab === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label 
                    htmlFor="first-name-input"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
                  >
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="first-name-input"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Camille"
                      className="block w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="last-name-input"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    id="last-name-input"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Laurent"
                    className="block w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label 
                htmlFor="email-input"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="connoisseur@luxury.com"
                  className="block w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="password-input"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {tab === 'signup' && (
                <p className="text-[11px] text-stone-400 mt-1">
                  At least 6 characters.
                </p>
              )}
            </div>

            <button
              id="auth-submit-button"
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-[#1A1715] hover:bg-[#2C2724] text-[#FAF8F5] font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Processing...</span>
                </>
              ) : tab === 'signin' ? (
                <span>Sign In to JewelMind</span>
              ) : (
                <span>Create My Account</span>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Sign-in */}
          <div className="pt-2 border-t border-stone-100">
            <button
              id="auth-demo-signin-button"
              type="button"
              onClick={handleDemoSignIn}
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Instant 1-Click Demo Sign-In (Camille Laurent)</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-stone-400">
            Protected with role-based security & private personalized recommendations.
          </p>

        </div>
      </div>
    </div>
  );
};

