/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useUI } from '../lib/state';
import { ArrowRight } from 'lucide-react';

const TRANSLITERATIONS = [
  { text: 'Co-founder', lang: 'English' },
  { text: 'Cofundador', lang: 'Spanish' },
  { text: 'Mitgründer', lang: 'German' },
  { text: 'Cofondateur', lang: 'French' },
  { text: 'Сооснователь', lang: 'Russian' },
  { text: '共同創業者', lang: 'Japanese' },
  { text: '联合创始人', lang: 'Chinese' },
  { text: 'شريك مؤسس', lang: 'Arabic' },
  { text: 'सह-संस्थापक', lang: 'Hindi' },
  { text: 'Συνιδρυτής', lang: 'Greek' },
  { text: 'מייסד שותף', lang: 'Hebrew' },
  { text: '공동 창립자', lang: 'Korean' },
  { text: 'Đồng sáng lập', lang: 'Vietnamese' },
  { text: 'ผู้ร่วมก่อตั้ง', lang: 'Thai' },
  { text: 'Mede-oprichter', lang: 'Dutch' },
  { text: 'Medgrundare', lang: 'Swedish' },
  { text: 'Kurucu Ortak', lang: 'Turkish' },
  { text: 'Cofondatore', lang: 'Italian' },
  { text: 'Cofundador', lang: 'Portuguese' },
];

/**
 * The initial welcome screen for the application. It provides a cinematic
 * entry sequence mimicking the Intute splash screen.
 */
export default function WelcomeScreen() {
  const { setShowWelcomeScreen, setShowDisclaimer } = useUI();
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Generate random positions and animations for transliterations once
  const floatingElements = useMemo(() => {
    return TRANSLITERATIONS.map((item, i) => ({
      ...item,
      id: i,
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`,
      fontSize: `${Math.random() * 1.5 + 1}rem`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 10 + 10}s`,
      opacity: Math.random() * 0.3 + 0.1,
    }));
  }, []);

  // Trigger the entrance animation shortly after the component mounts.
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handles the action to close the welcome screen. It triggers an exit
   * animation and then proceeds to the main app.
   */
  function handleClose() {
    setIsExiting(true);
    // Wait for the exit animation to complete before changing the UI state.
    setTimeout(() => {
      setShowWelcomeScreen(false);
      setShowDisclaimer(true);
    }, 800); // Match the CSS transition duration.
  }

  return (
    <div
      className={`welcome-screen-shroud ${isVisible ? 'visible' : ''} ${
        isExiting ? 'exiting' : ''
      }`}
    >
      {/* Floating Transliterations */}
      <div className="floating-container">
        {floatingElements.map((el) => (
          <div
            key={el.id}
            className="floating-text"
            style={{
              top: el.top,
              left: el.left,
              fontSize: el.fontSize,
              animationDelay: el.delay,
              animationDuration: el.duration,
              opacity: el.opacity,
            } as React.CSSProperties}
          >
            {el.text}
          </div>
        ))}
      </div>

      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-header">
            <h1 className="welcome-title">SOLOSCRIBE</h1>
            <p className="welcome-subtitle">
              Your AI co-founder and ideation partner
            </p>
          </div>

          <button onClick={handleClose} className="start-button glass-button">
            <span>Start session</span>
            <ArrowRight size={20} className="arrow-icon" />
          </button>

          <div className="powered-by-gemini welcome-footer">
            <svg
              className="gemini-star"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
                fill="currentColor"
              />
            </svg>
            <span>Powered by Gemini</span>
          </div>
        </div>
      </div>
    </div>
  );
}
