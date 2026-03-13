/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLogStore, usePerfLogStore } from '../lib/state';
import Modal from './Modal';
import { useUI } from '../lib/state';
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Assigns a specific CSS class to a log row based on the API/Action type
 * for color-coding purposes, making the log easier to scan.
 * @param api The log entry's API string.
 * @returns The corresponding CSS class name.
 */
function getLogRowClass(api: string): string {
  if (api.startsWith('System Prompt')) return 'log-row-system';
  if (api.startsWith('Agent Response')) return 'log-row-agent';
  if (api.startsWith('User Speech') || api.startsWith('User Edit')) return 'log-row-user';
  if (api.startsWith('Function Call')) return 'log-row-function';
  return ''; // No special class for other types
}

/**
 * Formats a number of bytes into a human-readable string (e.g., "1.2 KB").
 */
function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * A modal that displays a detailed log of all interactions with the GenAI API,
 * as well as user actions, for debugging purposes.
 */
export default function DebugModal() {
  const { logs, suppressedLogs, suppressedAudioCount } = useLogStore();
  const { logs: perfLogs, clearLogs: clearPerfLogs } = usePerfLogStore();
  const {
    setShowDebugModal,
    suppressRedundantLogs,
    setSuppressRedundantLogs,
    suppressStaleAgentResponses,
    setSuppressStaleAgentResponses,
    suppressPostFlushAudio,
    setSuppressPostFlushAudio,
  } = useUI();
  const [activeTab, setActiveTab] = useState('interactions');
  // State to track which log entry is currently expanded.
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  // State to track which prompt version is being hovered over to highlight related logs.
  const [hoveredPromptVersion, setHoveredPromptVersion] = useState<number | null>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy All Logs');

  // Poll for memory usage while the modal is open to help diagnose memory leaks.
  useEffect(() => {
    // performance.memory is a non-standard API, so check for its existence.
    const memory = (performance as any).memory;
    if (!memory) return;

    const interval = setInterval(() => {
      setMemoryUsage(memory.usedJSHeapSize);
    }, 1000);
    setMemoryUsage(memory.usedJSHeapSize); // Set initial value immediately.

    return () => clearInterval(interval);
  }, []);

  // Calculate total characters and audio bytes sent/received for the session stats.
  // This is memoized to avoid recalculating on every render.
  const {
    totalInputChars,
    totalOutputChars,
    totalInputAudioBytes,
    totalOutputAudioBytes,
  } = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        if (log.api.startsWith('User') || log.api.startsWith('System Prompt')) {
          if (typeof log.inputSize === 'number') acc.totalInputChars += log.inputSize;
          if (typeof log.audioSize === 'number') acc.totalInputAudioBytes += log.audioSize;
        } else if (log.api.startsWith('Agent') || log.api.startsWith('Function Call')) {
          if (typeof log.outputSize === 'number') acc.totalOutputChars += log.outputSize;
          if (typeof log.audioSize === 'number') acc.totalOutputAudioBytes += log.audioSize;
        }
        return acc;
      },
      { totalInputChars: 0, totalOutputChars: 0, totalInputAudioBytes: 0, totalOutputAudioBytes: 0 }
    );
  }, [logs]);

  /**
   * Copies both the interaction and performance logs to the clipboard as a single
   * JSON object for easy sharing and analysis.
   */
  const handleCopyLogs = () => {
    const allLogs = {
      interactionLogs: logs,
      performanceLogs: perfLogs,
    };
    const jsonString = JSON.stringify(allLogs, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy All Logs'), 2000);
    });
  };

  // Convert raw audio bytes to a more understandable duration in seconds.
  // Assumes 24kHz sample rate and 16-bit depth (2 bytes per sample).
  const BYTES_PER_SECOND = 24000 * 2;
  const inputAudioDuration = (totalInputAudioBytes / BYTES_PER_SECOND).toFixed(1);
  const outputAudioDuration = (totalOutputAudioBytes / BYTES_PER_SECOND).toFixed(1);

  const reversedPerfLogs = useMemo(() => [...perfLogs].reverse(), [perfLogs]);

  return (
    <Modal onClose={() => setShowDebugModal(false)} className="debug-modal-container">
      <div className="debug-modal">
        <div className="debug-header">
          <div className="debug-header-top">
            <h2>Interaction Log (Last 50)</h2>
            <div className="debug-actions">
              <button onClick={handleCopyLogs} className="copy-logs-button">{copyButtonText}</button>
            </div>
          </div>
          <div className="debug-stats">
            {memoryUsage !== null && <div className="stat-item"><strong>Memory:</strong> {formatBytes(memoryUsage)}</div>}
            <div className="stat-item"><strong>Text Sent:</strong> {totalInputChars.toLocaleString()} chars</div>
            <div className="stat-item"><strong>Text Rcvd:</strong> {totalOutputChars.toLocaleString()} chars</div>
            <div className="stat-item"><strong>Audio Sent:</strong> {inputAudioDuration}s</div>
            <div className="stat-item"><strong>Audio Rcvd:</strong> {outputAudioDuration}s</div>
            <div className="stat-item"><strong>Suppressed Audio:</strong> {suppressedAudioCount}</div>
          </div>
          <div className="debug-controls">
            <label>
              <input
                type="checkbox"
                checked={suppressRedundantLogs}
                onChange={e => setSuppressRedundantLogs(e.target.checked)}
              />
              Suppress redundant system prompts
            </label>
            <label>
              <input
                type="checkbox"
                checked={suppressStaleAgentResponses}
                onChange={e =>
                  setSuppressStaleAgentResponses(e.target.checked)
                }
              />
              Suppress stale agent responses
            </label>
            <label>
              <input
                type="checkbox"
                checked={suppressPostFlushAudio}
                onChange={e =>
                  setSuppressPostFlushAudio(e.target.checked)
                }
              />
              Suppress post-flush audio
            </label>
          </div>
          <div className="debug-tabs">
            <button
              onClick={() => setActiveTab('interactions')}
              className={activeTab === 'interactions' ? 'active' : ''}
            >
              Interaction Log
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={activeTab === 'performance' ? 'active' : ''}
            >
              Performance Log
            </button>
            <button
              onClick={() => setActiveTab('suppressed')}
              className={activeTab === 'suppressed' ? 'active' : ''}
            >
              Suppressed Log
            </button>
          </div>
        </div>

        {activeTab === 'interactions' && (
           <div className="debug-log-container">
            <table>
              <thead>
                <tr>
                  <th>Turn</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>API / Action</th>
                  <th title="Prompt Version">PV</th>
                  <th>Input Size</th>
                  <th>Output Size</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  // A heuristic to detect system prompts that haven't changed significantly.
                  const prevLog = logs[index + 1];
                  let isRedundant = false;
                  if (log.api === 'System Prompt' && prevLog?.api === 'System Prompt' &&
                      typeof log.inputSize === 'number' && typeof prevLog.inputSize === 'number' &&
                      Math.abs(log.inputSize - prevLog.inputSize) <= 2) {
                    isRedundant = true;
                  }

                  if (isRedundant && suppressRedundantLogs) return null;

                  const rowClass = getLogRowClass(log.api);
                  const isHighlighted = hoveredPromptVersion !== null && log.promptVersion === hoveredPromptVersion;
                  const isExpanded = expandedRowIndex === index;

                  return (
                    <React.Fragment key={index}>
                      <tr
                        className={`clickable-log-row ${rowClass} ${isHighlighted ? 'highlighted-row' : ''}`.trim()}
                        onMouseEnter={() => log.promptVersion !== undefined && setHoveredPromptVersion(log.promptVersion)}
                        onMouseLeave={() => setHoveredPromptVersion(null)}
                        onClick={() => setExpandedRowIndex(isExpanded ? null : index)}
                      >
                        <td>{log.turn ?? '--'}</td>
                        <td>{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}</td>
                        <td>{log.endTimestamp ? log.endTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }) : '--'}</td>
                        <td>
                          {log.api}
                          {isRedundant && <span className="redundant-flag"> (redundant)</span>}
                        </td>
                        <td>{log.promptVersion ?? ''}</td>
                        <td>
                          {log.inputSize.toLocaleString()}
                          {log.audioSize && <div><small>({formatBytes(log.audioSize)})</small></div>}
                        </td>
                        <td>
                          {log.outputSize.toLocaleString()}
                          {log.audioSize && log.api.startsWith('Agent') && <div><small>({formatBytes(log.audioSize)})</small></div>}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="log-details-row">
                          <td colSpan={7}>
                            <div className="log-details-content">
                              {log.audioBlob && (
                                <div className="log-details-section">
                                  <h4>Audio Playback</h4>
                                  <audio controls src={URL.createObjectURL(log.audioBlob)} className="w-full mt-2" />
                                </div>
                              )}
                              {log.prompt && (
                                <div className="log-details-section">
                                  <h4>Prompt</h4>
                                  <pre>{log.prompt}</pre>
                                </div>
                              )}
                              {log.response && (
                                <div className="log-details-section">
                                  <h4>Response</h4>
                                  <pre>{log.response}</pre>
                                </div>
                              )}
                              {log.error && (
                                <div className="log-details-section">
                                  <h4>Error Details</h4>
                                  <pre className="error-details">{log.error}</pre>
                                </div>
                              )}
                              {(!log.prompt && !log.response && !log.error) && (
                                <p className="no-details">No further details for this entry.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7}>No interactions logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'suppressed' && (
           <div className="debug-log-container">
            <table>
              <thead>
                <tr>
                  <th>Turn</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>API / Action</th>
                  <th title="Prompt Version">PV</th>
                  <th>Input Size</th>
                  <th>Output Size</th>
                </tr>
              </thead>
              <tbody>
                {suppressedLogs.map((log, index) => {
                  const rowClass = getLogRowClass(log.api);
                  const isHighlighted = hoveredPromptVersion !== null && log.promptVersion === hoveredPromptVersion;
                  const isExpanded = expandedRowIndex === index;

                  return (
                    <React.Fragment key={index}>
                      <tr
                        className={`clickable-log-row ${rowClass} ${isHighlighted ? 'highlighted-row' : ''}`.trim()}
                        onMouseEnter={() => log.promptVersion !== undefined && setHoveredPromptVersion(log.promptVersion)}
                        onMouseLeave={() => setHoveredPromptVersion(null)}
                        onClick={() => setExpandedRowIndex(isExpanded ? null : index)}
                      >
                        <td>{log.turn ?? '--'}</td>
                        <td>{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}</td>
                        <td>{log.endTimestamp ? log.endTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }) : '--'}</td>
                        <td>
                          {log.api}
                        </td>
                        <td>{log.promptVersion ?? ''}</td>
                        <td>
                          {log.inputSize.toLocaleString()}
                          {log.audioSize && <div><small>({formatBytes(log.audioSize)})</small></div>}
                        </td>
                        <td>
                          {log.outputSize.toLocaleString()}
                          {log.audioSize && log.api.startsWith('Agent') && <div><small>({formatBytes(log.audioSize)})</small></div>}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="log-details-row">
                          <td colSpan={7}>
                            <div className="log-details-content">
                              {log.audioBlob && (
                                <div className="log-details-section">
                                  <h4>Audio Playback</h4>
                                  <audio controls src={URL.createObjectURL(log.audioBlob)} className="w-full mt-2" />
                                </div>
                              )}
                              {log.prompt && (
                                <div className="log-details-section">
                                  <h4>Prompt</h4>
                                  <pre>{log.prompt}</pre>
                                </div>
                              )}
                              {log.response && (
                                <div className="log-details-section">
                                  <h4>Response</h4>
                                  <pre>{log.response}</pre>
                                </div>
                              )}
                              {log.error && (
                                <div className="log-details-section">
                                  <h4>Error Details</h4>
                                  <pre className="error-details">{log.error}</pre>
                                </div>
                              )}
                              {(!log.prompt && !log.response && !log.error) && (
                                <p className="no-details">No further details for this entry.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {suppressedLogs.length === 0 && (
                  <tr>
                    <td colSpan={7}>No suppressed interactions logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'performance' && (
           <div className="debug-log-container">
              <div className="debug-controls">
                <button onClick={clearPerfLogs}>Clear Performance Logs</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Session ID</th>
                    <th>Turn</th>
                    <th>Delta (ms)</th>
                    <th>Event</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {reversedPerfLogs.map((log, index) => {
                    const timestamp = new Date(log.timestamp);
                    const time = timestamp.toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });
                    const milliseconds = timestamp
                      .getMilliseconds()
                      .toString()
                      .padStart(3, '0');
                    const fullTimestamp = `${time}.${milliseconds}`;

                    return (
                      <tr key={index}>
                        <td>{fullTimestamp}</td>
                        <td>{log.sessionId.replace('session_', '')}</td>
                        <td>{log.turn}</td>
                        <td>{log.delta?.toFixed(2) ?? 'N/A'}</td>
                        <td>{log.event}</td>
                        <td className="details-cell">
                          {log.details && (
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                   {perfLogs.length === 0 && (
                    <tr>
                      <td colSpan={6}>No performance events logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        )}
      </div>
    </Modal>
  );
}