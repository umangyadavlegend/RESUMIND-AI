import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardOverview } from './pages/DashboardOverview';
import { ScreeningWorkspace } from './pages/ScreeningWorkspace';
import { CandidateRankingPage } from './pages/CandidateRankingPage';
import { JobDescriptionsPage } from './pages/JobDescriptionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { api } from './services/api';
import { User, ScreeningResults, JobDescription } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [screeningResults, setScreeningResults] = useState<ScreeningResults | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Notifications
  const [logoutNotification, setLogoutNotification] = useState<string | null>(null);
  const [accessDeniedNotification, setAccessDeniedNotification] = useState<string | null>(null);

  // 1. Session check on application load (HttpOnly Cookie verification)
  useEffect(() => {
    (async () => {
      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setLoadingSession(false);
      }
    })();

    // Listen for unauthorized events from any API call (session expiration)
    const handleUnauthorized = () => {
      setUser(null);
      setAccessDeniedNotification('Your session has expired. Please sign in again.');
      setCurrentTab('auth');
    };

    window.addEventListener('resumind:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('resumind:unauthorized', handleUnauthorized);
    };
  }, []);

  // 2. Authentication success handler
  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setLogoutNotification(null);
    setAccessDeniedNotification(null);
    setCurrentTab('overview');
  };

  // 3. Logout handler (Calls POST /api/auth/logout, invalidates server session, wipes cookie)
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      // Clear all state in client memory
      setUser(null);
      setScreeningResults(null);
      setLogoutNotification('You have successfully signed out. Your server session has been securely invalidated.');
      setAccessDeniedNotification(null);
      setCurrentTab('auth');
      // Push history state to prevent browser back navigation exposing data
      window.history.pushState(null, '', window.location.href);
    }
  };

  const handleScreeningComplete = (results: ScreeningResults) => {
    setScreeningResults(results);
    setCurrentTab('candidates');
  };

  const handleSelectJobForScreening = (job: JobDescription) => {
    setCurrentTab('workspace');
  };

  // Navigation guard protecting dashboard routes
  const handleNavigate = (tab: string) => {
    setLogoutNotification(null);
    setAccessDeniedNotification(null);

    const publicTabs = ['landing', 'auth'];
    if (!publicTabs.includes(tab) && !user) {
      setAccessDeniedNotification('Authentication required. Please sign in to access the recruiter dashboard.');
      setCurrentTab('auth');
      return;
    }

    if (tab === 'candidates') {
      // Clear one-time screening results snapshot so "All Candidates" always pulls fresh from database
      setScreeningResults(null);
    }

    setCurrentTab(tab);
  };

  // Prevent back navigation from exposing dashboard data when logged out
  useEffect(() => {
    const handlePopState = () => {
      if (!user && currentTab !== 'landing' && currentTab !== 'auth') {
        setAccessDeniedNotification('Access denied. Please sign in.');
        setCurrentTab('auth');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, currentTab]);

  // Loading spinner during initial session handshake
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-accent-red border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-primary-muted font-mono tracking-wider">RESUMIND_SESSION_VERIFICATION</p>
      </div>
    );
  }

  // 1. Landing Page Route
  if (currentTab === 'landing') {
    return (
      <LandingPage
        onStartScreening={() => {
          if (user) {
            setCurrentTab('workspace');
          } else {
            setCurrentTab('auth');
          }
        }}
        onExplorePlatform={() => {
          if (user) {
            setCurrentTab('overview');
          } else {
            setCurrentTab('auth');
          }
        }}
      />
    );
  }

  // 2. Auth Page Route (Login, Register, Email Verification)
  if (currentTab === 'auth' || !user) {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        onCancel={() => setCurrentTab('landing')}
        logoutNotification={logoutNotification}
        accessDeniedNotification={accessDeniedNotification}
      />
    );
  }

  // 3. Protected Dashboard Layout & Routes
  return (
    <DashboardLayout
      currentTab={currentTab}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      user={user}
    >
      {currentTab === 'overview' && (
        <DashboardOverview
          onNavigate={handleNavigate}
          user={user}
        />
      )}

      {currentTab === 'workspace' && (
        <ScreeningWorkspace
          onScreeningComplete={handleScreeningComplete}
        />
      )}

      {currentTab === 'candidates' && (
        <CandidateRankingPage
          initialResults={screeningResults}
          onNavigateToWorkspace={() => setCurrentTab('workspace')}
        />
      )}

      {currentTab === 'jobs' && (
        <JobDescriptionsPage
          onSelectJobForScreening={handleSelectJobForScreening}
        />
      )}

      {currentTab === 'analytics' && <AnalyticsPage />}

      {currentTab === 'settings' && (
        <SettingsPage
          user={user}
          onLogout={handleLogout}
        />
      )}
    </DashboardLayout>
  );
}

export default App;
