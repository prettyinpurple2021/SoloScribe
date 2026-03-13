/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';
import { useUI } from '../lib/state';

/**
 * LegalDisclaimer component displays a mandatory notice to the user.
 * It ensures accessibility by trapping focus within the modal.
 */
export default function LegalDisclaimer() {
  const { setShowDisclaimer, setShowUserConfig } = useUI();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    // Find all focusable elements within the modal to implement focus trapping.
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    /**
     * Handles keyboard navigation to keep focus within the modal.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab: if on first element, wrap to last.
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab: if on last element, wrap to first.
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    // Focus the modal container initially.
    modal.focus();
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAcknowledge = () => {
    setShowDisclaimer(false);
    setShowUserConfig(true);
  };

  return (
    <div
      className="legal-disclaimer-overlay"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="legal-disclaimer-content">
        <h3 className="disclaimer-title">Please Note</h3>
        <ul className="disclaimer-list">
          <li>
            Make sure you have the necessary rights to any content you upload.
          </li>
          <li>
            Do not generate content that infringes on others' intellectual
            property or privacy rights.
          </li>
          <li>
            Your use of this generative AI service is subject to Google's{' '}
            <a
              href="https://policies.google.com/terms/generative-ai/use-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="disclaimer-link"
            >
              Prohibited Use Policy
            </a>
            .
          </li>
          <li>Gemini can make mistakes, so double-check it.</li>
        </ul>
        <div className="disclaimer-actions">
          <button onClick={handleAcknowledge} className="disclaimer-button">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
