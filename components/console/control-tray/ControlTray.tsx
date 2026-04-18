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
 * See the License for the apecific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  X, 
  RefreshCw, 
  Pause, 
  Play, 
  Keyboard, 
  HelpCircle,
  Settings
} from 'lucide-react';
import { AudioRecorder } from '../../../lib/audio-recorder';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { usePerfLogStore, useUI } from '../../../lib/state';
import { Tooltip } from '../../Tooltip';

export type ControlTrayProps = {
  children?: ReactNode;
};

// Minimum volume level that indicates user audio input is occurring.
const USER_AUDIO_INPUT_DETECTION_THRESHOLD = 0.01;

// Amount of delay in milliseconds after user audio input stops before the
// user is considered "not speaking".
const USER_TALKING_STATE_COOLDOWN_MS = 1500;

/**
 * The main control bar at the bottom of the screen, containing the
 * connect/disconnect button and microphone mute toggle.
 */
function ControlTray({ children }: ControlTrayProps) {
  // A single instance of AudioRecorder is created and managed for the component's lifecycle.
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const userSpeakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const firstAudioChunkSentRef = useRef(false);
  const bufferedAudioRef = useRef<string[]>([]);

  const { showAgentEdit, showUserConfig, theme, setShowHelpModal } = useUI();
  const { addLog: addPerfLog, startNewSession } = usePerfLogStore();
  const { client, connected, connect, disconnect, isConnecting } = useLiveAPIContext();

  // Reset the "first audio chunk sent" flag and talking state on disconnect to prepare for the next session.
  useEffect(() => {
    if (!connected && !isConnecting) {
      firstAudioChunkSentRef.current = false;
      setIsUserSpeaking(false);
    }
  }, [connected, isConnecting]);

  // This effect detects whether the user is speaking based on the microphone input volume.
  useEffect(() => {
    const onVolume = (volume: number) => {
      if (volume > USER_AUDIO_INPUT_DETECTION_THRESHOLD) {
        setIsUserSpeaking(true);
        if (userSpeakingTimeoutRef.current) {
          clearTimeout(userSpeakingTimeoutRef.current);
        }
        userSpeakingTimeoutRef.current = setTimeout(
          () => setIsUserSpeaking(false),
          USER_TALKING_STATE_COOLDOWN_MS,
        );
      }
    };

    audioRecorder.on('volume', onVolume);
    return () => {
      audioRecorder.off('volume', onVolume);
    };
  }, [audioRecorder]);

  // This effect ensures that the agent is disconnected if the user opens
  // the agent editor or user configuration modals, preventing unexpected
  // behavior while settings are being changed.
  useEffect(() => {
    if (showAgentEdit || showUserConfig) {
      if (connected) disconnect();
    }
  }, [showUserConfig, showAgentEdit, connected, disconnect]);

  // Automatically focuses the connect ('Play') button when the app is
  // in a disconnected state, providing a clear visual cue to the user.
  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // This is the core effect for managing the audio input pipeline.
  // It starts or stops the AudioRecorder based on the connection status and mute state.
  useEffect(() => {
    const handleError = (e: any) => {
      console.error('Live API Error in ControlTray:', e);
      bufferedAudioRef.current = [];
    };

    client.on('error', handleError);

    // The 'data' event from the AudioRecorder contains base64-encoded PCM audio.
    const onData = (base64: string) => {
      if (connected && !isConnecting) {
        // If we have buffered data, send it first to maintain continuity
        if (bufferedAudioRef.current.length > 0) {
          bufferedAudioRef.current.forEach(data => {
            client.sendRealtimeInput({
              media: {
                mimeType: 'audio/pcm;rate=24000',
                data,
              },
            });
          });
          bufferedAudioRef.current = [];
        }

        // Log the first audio chunk sent for performance analysis.
        if (!firstAudioChunkSentRef.current) {
          addPerfLog({ turn: 0, event: 'User Audio: First Chunk Sent', details: { size: base64.length } });
          firstAudioChunkSentRef.current = true;
        }

        client.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=24000',
            data: base64,
          },
        });
      } else if (isConnecting) {
        // Buffer data while connecting so we don't drop the start of the user's speech
        bufferedAudioRef.current.push(base64);
      }
    };

    // If we are connected, NOT connecting, and not muted, ensure recorder is active
    if (connected && !isConnecting && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      // recorder.start() is idempotent or handles being called while starting
      audioRecorder.start().catch(err => console.error("Mic start failed", err));
    } else {
      // Otherwise, ensure the recorder is stopped.
      audioRecorder.stop();
      bufferedAudioRef.current = [];
    }

    // Cleanup function to remove the event listener when the component unmounts
    // or when the dependencies change, preventing memory leaks.
    return () => {
      client.off('error', handleError);
      audioRecorder.off('data', onData);
    };
  }, [connected, isConnecting, client, muted, audioRecorder, addPerfLog]);

  // Automatically focuses the text input when it's shown.
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);

  const handleSendText = () => {
    if (textInput.trim() && connected) {
      client.send({ text: textInput });
      setTextInput('');
    }
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setTextInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  return (
    <section className="control-tray-container">
      {showTextInput && (
        <div className="text-input-overlay">
          <div className="text-input-container">
            <input
              ref={inputRef}
              type="text"
              className="text-input-field"
              placeholder="Type your command here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendText();
                } else if (e.key === 'Escape') {
                  setShowTextInput(false);
                }
              }}
            />
            <Tooltip content={isListening ? "Stop listening" : "Voice type"}>
              <button 
                className={cn('voice-type-btn', { listening: isListening })}
                onClick={toggleListening}
              >
                <Mic size={18} />
              </button>
            </Tooltip>
            <Tooltip content={connected ? "Send command" : "Connect to send commands"}>
              <button 
                className="text-input-action-btn send-btn brutalist-button" 
                onClick={handleSendText}
                disabled={!textInput.trim() || !connected}
              >
                <Send size={18} />
              </button>
            </Tooltip>
            <Tooltip content="Close">
              <button 
                className="text-input-action-btn close-btn brutalist-button" 
                onClick={() => setShowTextInput(false)}
              >
                <X size={18} />
              </button>
            </Tooltip>
          </div>
        </div>
      )}
      <div className="control-tray paper-dots">
        <Tooltip content="Help" position="top">
          <button
            className="action-button help-button"
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle size={20} />
            <span className="hidden sm:inline">HELP</span>
          </button>
        </Tooltip>

        <Tooltip content={muted ? "Unmute microphone" : "Mute microphone"} position="top">
          <button
            className={cn('action-button mic-button', {
              talking: isUserSpeaking && !muted && connected && !isConnecting,
              muted: muted
            })}
            onClick={() => setMuted(!muted)}
          >
            {!muted ? (
              <>
                <Mic size={20} />
                <span className="hidden sm:inline">MIC_ON</span>
              </>
            ) : (
              <>
                <MicOff size={20} />
                <span className="hidden sm:inline">MUTED</span>
              </>
            )}
          </button>
        </Tooltip>

        <Tooltip content={connected ? "Disconnect agent" : "Connect agent"} position="top">
          <button
            ref={connectButtonRef}
            className={cn('connect-toggle', { connected: connected && !isConnecting })}
            onClick={() => {
              if (connected) {
                disconnect();
              } else {
                startNewSession();
                addPerfLog({ turn: 0, event: 'User Action: Connect Clicked' });
                connect();
              }
            }}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>LINKING</span>
              </>
            ) : connected ? (
              <>
                <Pause size={20} />
                <span>STOP</span>
              </>
            ) : (
              <>
                <Play size={20} />
                <span>START</span>
              </>
            )}
          </button>
        </Tooltip>

        <Tooltip content="Type a command" position="top">
          <button
            className={cn('action-button keyboard-button', {
              active: showTextInput,
            })}
            onClick={() => setShowTextInput(!showTextInput)}
          >
            <Keyboard size={20} />
            <span className="hidden sm:inline">TYPE</span>
          </button>
        </Tooltip>

        <Tooltip content="Settings" position="top">
          <button
            className="action-button settings-button"
            onClick={() => useUI.getState().setShowUserConfig(true)}
          >
            <Settings size={20} />
            <span className="hidden sm:inline">SETTINGS</span>
          </button>
        </Tooltip>

        {children}
      </div>
  </section>
);
}

export default memo(ControlTray);
