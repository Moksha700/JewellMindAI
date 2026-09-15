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

  const { signIn, signUp, user } = useAuth();

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
    setSubmitting(false);
  };

  const handleDemoSignIn = async () => {
    setSubmitting(true);
    // Demo credentials
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
    setSubmitting(false);
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
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E7E2D8] shadow-lg space-y-6">
          
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
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
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
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
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
                  At least 6 characters. Auto-confirmed during development.
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

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-3 text-stone-400 font-semibold">Or Instant Access</span>
            </div>
          </div>

          {/* Quick 1-Click Demo Sign-in */}
          <button
            id="auth-demo-signin-button"
            type="button"
            onClick={handleDemoSignIn}
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Instant Demo Sign-In (Camille Laurent)</span>
          </button>

          <p className="text-[11px] text-center text-stone-400">
            Protected by Cloud Firestore RLS with verified user_roles + has_role security policy.
          </p>

        </div>
      </div>
    </div>
  );
};
