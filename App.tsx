/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import AgentEdit from './components/AgentEdit';
import ControlTray from './components/console/control-tray/ControlTray';
import DebugModal from './components/DebugModal';
import ErrorScreen from './components/ErrorScreen';
import KeynoteCompanion from './components/workspace/KeynoteCompanion';
import Header from './components/Header';
import UserSettings from './components/UserSettings';
import WelcomeScreen from './components/WelcomeScreen';
import { ProjectSidebar } from './components/workspace/ProjectSidebar';
import { LiveAPIProvider, useLiveAPIContext } from './contexts/LiveAPIContext';
import { useAgent, useUI } from './lib/state';
// Fix: Import React to resolve "Cannot find namespace 'React'" error.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { themes } from './lib/themes';
import FloatingAvatar from './components/FloatingAvatar';
import HelpModal from './components/HelpModal';
import LegalDisclaimer from './components/LegalDisclaimer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PublicInterview } from './components/PublicInterview';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationManager } from './components/workspace/NotificationManager';

const getApiKey = () => {
  if (typeof window !== 'undefined' && window.process?.env?.API_KEY && window.process.env.API_KEY !== '{{API_KEY}}') {
    return window.process.env.API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (key && key !== '{{API_KEY}}') {
      return key;
    }
  }
  return undefined;
};

const API_KEY = getApiKey() as string;

// Minimum volume level that indicates audio output is occurring.
// This threshold prevents the avatar from reacting to negligible noise.
const AUDIO_OUTPUT_DETECTION_THRESHOLD = 0.05;

// Amount of delay in milliseconds after audio output stops before the avatar
// is considered "not talking". This creates a more natural-looking effect,
// preventing the talking animation from stopping abruptly between words.
const TALKING_STATE_COOLDOWN_MS = 2000;

import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { PublicProjectView } from './components/workspace/PublicProjectView';

/**
 * Renders the main content of the application, including the header, modals,
 * the draggable agent avatar, the primary app area (KeynoteCompanion), and the control tray.
 */
function AppContent() {
  const { showUserConfig, showAgentEdit, showDebugModal, showHelpModal, showDisclaimer } =
    useUI();

  return (
    <>
      <ErrorScreen />
      <ProjectSidebar />
      <Header />
      <NotificationManager />

      <FloatingAvatar />

      {/* Conditionally render modals based on UI state */}
      {showUserConfig && <UserSettings />}
      {showAgentEdit && <AgentEdit />}
      {showDebugModal && <DebugModal />}
      {showHelpModal && <HelpModal />}
      {showDisclaimer && <LegalDisclaimer />}
      <div className="streaming-console paper-legal">
        <main>
          <div className="main-app-area">
            <ErrorBoundary>
              <KeynoteCompanion />
            </ErrorBoundary>
          </div>

          <ErrorBoundary>
            <ControlTray></ControlTray>
          </ErrorBoundary>
        </main>
      </div>
    </>
  );
}

/**
 * Main application component. It checks for the required API key, sets up the
 * global theme, and provides the LiveAPI context to its children.
 */
function AppRoutes() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const { showWelcomeScreen, setShowWelcomeScreen, hasCompletedOnboarding, theme, font } = useUI();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Show welcome screen if user is not logged in OR if they haven't completed onboarding
    if (!loading) {
      if (!user || !hasCompletedOnboarding) {
        setShowWelcomeScreen(true);
      } else {
        setShowWelcomeScreen(false);
      }
    }
  }, [user, loading, hasCompletedOnboarding, setShowWelcomeScreen]);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback for local dev or if aistudio is not available
        setHasKey(!!getApiKey());
      }
    };
    checkKey();
  }, []);

  // This effect applies the selected theme's colors as CSS variables to the root element,
  // allowing for dynamic theming of the entire application.
  useEffect(() => {
    const selectedTheme = themes.find(t => t.name === theme) || themes[0];
    const root = document.documentElement;
    root.style.setProperty('--theme-bg', selectedTheme.colors[0]);
    root.style.setProperty('--theme-surface', selectedTheme.colors[1]);
    root.style.setProperty('--theme-accent', selectedTheme.colors[2]);
    root.style.setProperty('--theme-text', selectedTheme.colors[3]);
    root.style.setProperty('--theme-document-bg', selectedTheme.colors[4]);
  }, [theme]);

  // This effect applies the selected font as a CSS variable to the root element.
  useEffect(() => {
    document.documentElement.style.setProperty('--font-document', font);
  }, [font]);

  const handleSelectKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasKey(true);
    }
  };

  if (hasKey === null) {
    return <div className="fullscreen-error"><p>Loading...</p></div>;
  }

  if (!hasKey) {
    return (
      <div className="fullscreen-error">
        <h1 style={{ color: 'var(--theme-accent)' }}>API Key Required</h1>
        <p>This application requires a paid Google Cloud API key to generate images and use the Live API.</p>
        <p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" style={{ color: 'var(--theme-accent-secondary)' }}>
            Learn more about billing
          </a>
        </p>
        <button onClick={handleSelectKey} className="start-button glass-button" style={{ marginTop: '20px' }}>
          <span>Select API Key</span>
        </button>
      </div>
    );
  }

  const currentApiKey = getApiKey() as string;
  const interviewId = searchParams.get('interview');

  if (interviewId) {
    return <PublicInterview interviewId={interviewId} />;
  }

  return (
    <Routes>
      <Route path="/share/:shareId" element={<PublicProjectView />} />
      <Route path="/" element={
        <div className="App">
          <Toaster position="top-center" theme="light" />
          {showWelcomeScreen && <WelcomeScreen />}
          <LiveAPIProvider apiKey={currentApiKey}>
            <AppContent />
          </LiveAPIProvider>
        </div>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;