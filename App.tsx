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
import ErrorScreen from './components/demo/ErrorScreen';
import KeynoteCompanion from './components/demo/keynote-companion/KeynoteCompanion';
import Header from './components/Header';
import UserSettings from './components/UserSettings';
import WelcomeScreen from './components/WelcomeScreen';
import { LiveAPIProvider, useLiveAPIContext } from './contexts/LiveAPIContext';
import { useAgent, useUI } from './lib/state';
// Fix: Import React to resolve "Cannot find namespace 'React'" error.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { themes } from './lib/themes';
import FloatingAvatar from './components/FloatingAvatar';
import HelpModal from './components/HelpModal';
import LegalDisclaimer from './components/LegalDisclaimer';
import { useAuth } from './contexts/AuthContext';
import { PublicInterview } from './components/PublicInterview';

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
      <Header />

      <FloatingAvatar />

      {/* Conditionally render modals based on UI state */}
      {showUserConfig && <UserSettings />}
      {showAgentEdit && <AgentEdit />}
      {showDebugModal && <DebugModal />}
      {showHelpModal && <HelpModal />}
      {showDisclaimer && <LegalDisclaimer />}
      <div className="streaming-console">
        <main>
          <div className="main-app-area">
            <KeynoteCompanion />
          </div>

          <ControlTray></ControlTray>
        </main>
      </div>
    </>
  );
}

/**
 * Main application component. It checks for the required API key, sets up the
 * global theme, and provides the LiveAPI context to its children.
 */
function App() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const { showWelcomeScreen, setShowWelcomeScreen, theme, font } = useUI();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      setShowWelcomeScreen(true);
    }
  }, [user, loading, setShowWelcomeScreen]);

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

  const urlParams = new URLSearchParams(window.location.search);
  const interviewId = urlParams.get('interview');

  if (interviewId) {
    return <PublicInterview interviewId={interviewId} />;
  }

  return (
    <div className="App">
      {showWelcomeScreen && <WelcomeScreen />}
      <LiveAPIProvider apiKey={currentApiKey}>
        <AppContent />
      </LiveAPIProvider>
    </div>
  );
}

export default App;