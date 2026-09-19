/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MarketingPage } from './components/marketing/MarketingPage';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardShell } from './components/dashboard/DashboardShell';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type Route = 'home' | 'auth' | 'dashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<Route>('home');
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  // Sync hash routing with application state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'dashboard') {
        setCurrentRoute('dashboard');
      } else if (hash === 'auth' || hash === 'signin' || hash === 'signup') {
        setCurrentRoute('auth');
        setAuthTab(hash === 'signup' ? 'signup' : 'signin');
      } else if (hash === 'knowledge_base' || hash === 'knowledge-base') {
        if (!user) {
          // If a logged-out user attempts to access Knowledge Base directly, redirect to Login
          setCurrentRoute('auth');
          setAuthTab('signin');
          window.location.hash = 'signin';
        } else {
          setCurrentRoute('home');
          setTimeout(() => {
            const el = document.getElementById('knowledge-base');
            el?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } else if (hash === 'chat' || hash === 'chatbot') {
        setCurrentRoute('home');
      } else {
        setCurrentRoute('home');
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  // Protected route enforcement:
  // 1. If user is signed in and on /auth -> redirect to home page
  // 2. If user is unauthenticated and tries to open /dashboard -> redirect to /auth
  useEffect(() => {
    if (loading) return;

    if (user && currentRoute === 'auth') {
      navigateToRoute('home');
    } else if (!user && currentRoute === 'dashboard') {
      navigateToRoute('auth');
    }
  }, [user, loading, currentRoute]);

  const navigateToRoute = (route: Route, tab: 'signin' | 'signup' = 'signin') => {
    setAuthTab(tab);
    setCurrentRoute(route);
    window.location.hash = route === 'home' ? '' : route;
  };

  // Safe initialization watchdog timer ensures the app transitions from the splash screen
  const [initTimerExpired, setInitTimerExpired] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitTimerExpired(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const isInitializing = loading && !initTimerExpired;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center space-y-3 font-sans-clean">
        <div className="w-12 h-12 rounded-2xl bg-[#1A1715] flex items-center justify-center shadow-md border border-amber-500/20">
          <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
        </div>
        <p className="text-sm font-semibold text-stone-600">Initializing JewelMind AI...</p>
      </div>
    );
  }

  // Render view according to current route
  if (currentRoute === 'auth') {
    return (
      <AuthPage
        initialTab={authTab}
        onNavigateHome={() => navigateToRoute('home')}
        onSuccessRedirect={() => navigateToRoute('home')}
      />
    );
  }

  if (currentRoute === 'dashboard') {
    // Protected route check
    if (!user) {
      return (
        <AuthPage
          initialTab="signin"
          onNavigateHome={() => navigateToRoute('home')}
          onSuccessRedirect={() => navigateToRoute('home')}
        />
      );
    }
    return <DashboardShell />;
  }

  // Default: Marketing Homepage
  return (
    <MarketingPage
      onNavigateAuth={(tab) => {
        navigateToRoute('auth', tab);
      }}
      onNavigateDashboard={() => {
        navigateToRoute('dashboard');
      }}
      onOpenQuickFeature={(feature) => {
        if (user) {
          navigateToRoute('dashboard');
        } else {
          navigateToRoute('auth', 'signin');
        }
      }}
    />
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
