/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import Modal from './Modal';
import { useAgent, useUI, useUser } from '../lib/state';
import { useAuth } from '../contexts/AuthContext';
import { Theme, themes } from '../lib/themes';
import { FONT_OPTIONS, PLACEHOLDER_DOC } from '../lib/constants';
import React, { useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { FileUp, X, FileText, Loader2, ChevronDown, Sparkles, Bell, Settings, Camera, RefreshCw, Webhook, CreditCard, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip } from './Tooltip';

// Set up PDF.js worker
// Using unpkg as it's often more reliable for specific versioned assets
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FormatOption = 'Markdown' | 'HTML';
const FORMAT_OPTIONS: FormatOption[] = ['Markdown', 'HTML'];

/**
 * A component to capture a profile picture using the camera.
 */
function CameraCapture({ onCapture, initialImage }: { onCapture: (data: string | undefined) => void, initialImage?: string }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  const clearImage = () => {
    onCapture(undefined);
  };

  return (
    <div className="camera-capture-container">
      <div className="camera-preview-wrapper">
        {isStreaming ? (
          <video ref={videoRef} autoPlay playsInline className="camera-preview" />
        ) : initialImage ? (
          <img src={initialImage} alt="Profile" className="profile-picture-img" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex items-center justify-center h-full opacity-20">
            <Camera size={48} />
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="camera-actions">
        {!isStreaming ? (
          <>
            <button type="button" onClick={startCamera} className="brutalist-button camera-btn">
              {initialImage ? 'Retake' : 'Capture'}
            </button>
            {initialImage && (
              <button type="button" onClick={clearImage} className="brutalist-button-outline camera-btn">
                Remove
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={captureImage} className="brutalist-button camera-btn">
              Snap
            </button>
            <button type="button" onClick={stopCamera} className="brutalist-button-outline camera-btn">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A custom dropdown component for settings.
 */
function CustomDropdown({ 
  value, 
  options, 
  onChange, 
  placeholder 
}: { 
  value: string, 
  options: string[], 
  onChange: (val: string) => void,
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown-container" ref={containerRef}>
      <button 
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={16} style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          opacity: 0.5
        }} />
      </button>
      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map(option => (
            <button
              key={option}
              type="button"
              className={`custom-dropdown-item ${value === option ? 'active' : ''}`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A modal for configuring user settings for the writing session.
 * It features a modern, "jazzy" design for a more engaging user experience.
 */
export default function UserSettings() {
  // Hooks to manage user-specific data (name, info, topic, etc.)
  const { name, info, topic, format, profilePicture, setName, setInfo, setTopic, setFormat, setProfilePicture, contextFiles, addContextFile, removeContextFile } =
    useUser();
  // Hooks to manage UI state (modal visibility, current theme)
  const { 
    setShowUserConfig, 
    font, 
    setFont, 
    useSearch, 
    setUseSearch, 
    liveApiModel, 
    setLiveApiModel, 
    documentContent, 
    setHasCompletedOnboarding, 
    setShowWelcomeScreen,
    notificationPreferences,
    setNotificationPreferences,
    webhookUrl,
    setWebhookUrl
  } = useUI();
  // Hooks to manage agent state (needed for updating agent color on theme change)
  const { current: agent, update: updateAgent } = useAgent();
  const { signOut } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * A placeholder function that currently just closes the modal.
   * Could be expanded in the future if client-side settings need more complex handling.
   */
  function updateClient() {
    setShowUserConfig(false);
  }

  const handleReplayOnboarding = () => {
    setHasCompletedOnboarding(false);
    setShowWelcomeScreen(true);
    setShowUserConfig(false);
  };

  const handleEditAgent = () => {
    setShowUserConfig(false);
    useUI.getState().setShowAgentEdit(true);
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationPreferences({ browserNotifications: true });
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const toggleReminderTiming = (minutes: number) => {
    const current = notificationPreferences.reminderTimings;
    if (current.includes(minutes)) {
      setNotificationPreferences({ 
        reminderTimings: current.filter(m => m !== minutes) 
      });
    } else {
      setNotificationPreferences({ 
        reminderTimings: [...current, minutes].sort((a, b) => a - b) 
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files) as File[]) {
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n';
          }

          addContextFile({
            name: file.name,
            text: fullText,
            type: 'pdf'
          });
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const text = await file.text();
          addContextFile({
            name: file.name,
            text,
            type: 'text'
          });
        } else if (file.name.endsWith('.md')) {
          const text = await file.text();
          addContextFile({
            name: file.name,
            text,
            type: 'markdown'
          });
        }
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Modal onClose={() => setShowUserConfig(false)} title="System Configuration">
      <div className="userSettings">
        <p className="config-description">Initialize documentation parameters. Define identity and objective.</p>

        <form
          onSubmit={e => {
            e.preventDefault();
            setShowUserConfig(false);
            updateClient();
          }}
        >
          {/* Identity Section */}
          <div className="settings-section">
            <h3 className="section-title"><Sparkles size={16} /> Identity & Context</h3>
            
            <CameraCapture onCapture={setProfilePicture} initialImage={profilePicture} />

            <div className="settings-grid">
              <div>
                <p className="input-label">Your name</p>
                <input
                  type="text"
                  name="name"
                  className="brutalist-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="What do you like to be called?"
                />
              </div>

              <div>
                <p className="input-label">Topic</p>
                <input
                  type="text"
                  name="topic"
                  className="brutalist-input"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="A business plan, pitch deck, marketing strategy, lean canvas, etc."
                />
              </div>
            </div>
          </div>

          {/* Notifications Section - PROMINENT */}
          <div className="settings-section prominent-section">
            <h3 className="section-title"><Bell size={16} /> Task Notifications</h3>
            <div className="notification-controls">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.enabled}
                    onChange={e => setNotificationPreferences({ enabled: e.target.checked })}
                    className="brutalist-checkbox"
                  />
                  <span className="font-bold">Enable Reminders</span>
                </label>

                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className={`brutalist-button-small ${notificationPreferences.browserNotifications ? 'active' : ''}`}
                >
                  {notificationPreferences.browserNotifications ? 'Browser Notifications Active' : 'Enable Browser Notifications'}
                </button>
              </div>

              {notificationPreferences.enabled && (
                <div className="reminder-timings">
                  <p className="input-label mb-2">Reminder Timings (minutes before due)</p>
                  <div className="flex flex-wrap gap-2">
                    {[5, 15, 30, 60, 120, 1440].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => toggleReminderTiming(mins)}
                        className={`timing-chip ${notificationPreferences.reminderTimings.includes(mins) ? 'active' : ''}`}
                      >
                        {mins < 60 ? `${mins}m` : mins === 1440 ? '1d' : `${mins / 60}h`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appearance Section */}
          <div className="settings-section">
            <h3 className="section-title"><Settings size={16} /> Appearance & Model</h3>
            <div className="settings-grid">
              <div>
                <p className="input-label">Document Font</p>
                <CustomDropdown
                  value={font}
                  options={FONT_OPTIONS}
                  onChange={setFont}
                  placeholder="Select a font"
                />
              </div>

              <div>
                <p className="input-label">Live API Model</p>
                <CustomDropdown
                  value={liveApiModel === 'gemini-2.5-flash-native-audio-preview-12-2025' ? '12-2025' : '09-2025 (Default)'}
                  options={['12-2025', '09-2025 (Default)']}
                  onChange={(val) => setLiveApiModel(val === '12-2025' ? 'gemini-2.5-flash-native-audio-preview-12-2025' : 'gemini-2.5-flash-native-audio-preview-09-2025')}
                />
              </div>
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useSearch}
                  onChange={e => setUseSearch(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Use search as needed</span>
              </label>
            </div>
          </div>

          {/* Integrations Section */}
          <div className="settings-section">
            <h3 className="section-title"><Webhook size={16} /> Integrations & Webhooks</h3>
            <div>
              <p className="input-label">Outgoing Webhook URL</p>
              <input
                type="url"
                className="brutalist-input"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://zapier.com/hooks/..."
              />
              <p className="config-description" style={{ marginTop: '8px', fontSize: '11px' }}>
                SoloScribe will send events (like task completion) to this URL.
              </p>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="settings-section prominent-section bg-theme-accent/10">
            <h3 className="section-title"><CreditCard size={16} /> SoloScribe Pro Subscription</h3>
            <div className="p-4 border-2 border-black bg-white mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black uppercase text-sm tracking-widest">Current Plan: Free</span>
                <span className="bg-black text-white text-[10px] px-2 py-0.5 font-bold uppercase">Upgrade Needed</span>
              </div>
              <p className="text-xs opacity-70 mb-4">Unlock vertical-specific co-founders, unlimited projects, and advanced compliance auditing.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border-2 border-black hover:bg-theme-accent cursor-pointer transition-colors group">
                  <p className="font-bold text-xs uppercase">Creator Pro</p>
                  <p className="text-lg font-black">$19/mo</p>
                </div>
                <div className="p-3 border-2 border-black hover:bg-theme-accent cursor-pointer transition-colors group">
                  <p className="font-bold text-xs uppercase">SaaS Founder</p>
                  <p className="text-lg font-black">$49/mo</p>
                </div>
              </div>
            </div>
            <button type="button" className="brutalist-button w-full py-2 text-xs">MANAGE SUBSCRIPTION</button>
          </div>

          <details style={{ marginTop: '15px' }}>
            <summary>Context & Documents (Optional)</summary>
            <div className="details-content">
              <p className="context-description">
                Provide any background info worth knowing for this session.
              </p>
              <textarea
                rows={3}
                name="info"
                className="brutalist-textarea"
                value={info}
                onChange={e => setInfo(e.target.value)}
                placeholder="e.g., names, facts, style preferences"
              />

              <div className="context-section" style={{ marginTop: '20px' }}>
                <p>Context Documents (.pdf, .txt, .md)</p>
                <div className="pdf-upload-container">
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <button
                    type="button"
                    className="pdf-upload-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <FileUp size={18} />
                    )}
                    <span>{isUploading ? 'Processing...' : 'Upload Files'}</span>
                  </button>

                  {contextFiles.length > 0 && (
                    <div className="pdf-list">
                      {contextFiles.map(file => (
                        <div key={file.name} className="pdf-item">
                          <FileText size={14} className="pdf-icon" />
                          <Tooltip content={file.name} position="top">
                            <span className="pdf-name">{file.name}</span>
                          </Tooltip>
                          <Tooltip content="Remove File" position="top">
                            <button
                              type="button"
                              className="pdf-remove"
                              onClick={() => removeContextFile(file.name)}
                            >
                              <X size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </details>

          {documentContent === PLACEHOLDER_DOC && (
            <div style={{ marginTop: '15px' }}>
              <p className="input-label">Output Format</p>
              <div className="format-selector">
                {FORMAT_OPTIONS.map(f => (
                  <label key={f} className="format-option">
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      checked={format === f}
                      onChange={() => setFormat(f)}
                    />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button className="brutalist-button" style={{ marginTop: '20px', width: '100%' }}>Initialize Session</button>
          
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'center', gap: '24px' }}>
            <button 
              type="button" 
              onClick={handleEditAgent}
              className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              <Sparkles size={16} />
              <span>Edit Agent</span>
            </button>
            <button 
              type="button" 
              onClick={handleReplayOnboarding}
              className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              <Sparkles size={16} />
              <span>Replay Onboarding</span>
            </button>
            <button 
              type="button" 
              onClick={async () => {
                await signOut();
                setShowUserConfig(false);
              }}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
