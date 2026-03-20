/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';
import { useUI } from '../lib/state';

import Modal from './Modal';

/**
 * LegalDisclaimer component displays a mandatory notice to the user.
 * It ensures accessibility by trapping focus within the modal.
 */
export default function LegalDisclaimer() {
  const { setShowDisclaimer, setShowUserConfig } = useUI();

  const handleAcknowledge = () => {
    setShowDisclaimer(false);
    setShowUserConfig(true);
  };

  return (
    <Modal onClose={handleAcknowledge} title="Legal Protocol">
      <div className="legal-disclaimer-content">
        <p className="config-description">
          SoloScribe is an experimental documentation orchestration platform. 
          By initializing this session, you acknowledge and accept the following protocols:
        </p>
        <ul className="disclaimer-list">
          <li>
            Ensure you possess the necessary authorization for any uploaded content.
          </li>
          <li>
            Do not generate content that infringes upon third-party intellectual
            property or privacy rights.
          </li>
          <li>
            Utilization of this generative AI service is subject to Google's{' '}
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
          <li>The underlying LLM may produce inaccuracies. Verification is mandatory.</li>
        </ul>
        <div className="disclaimer-actions" style={{ marginTop: '20px' }}>
          <button onClick={handleAcknowledge} className="brutalist-button" style={{ width: '100%' }}>
            ACKNOWLEDGE & PROCEED
          </button>
        </div>
      </div>
    </Modal>
  );
}
