import React from 'react';
import { createRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-05-30',
});

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
