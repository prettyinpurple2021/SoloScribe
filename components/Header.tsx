/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { Agent } from '../lib/presets/agents';
import { useAgent, useUI, useUser } from '../lib/state';
import { FONT_OPTIONS } from '../lib/constants';
import c from 'classnames';
import { useEffect, useState, useRef } from 'react';
import { 
  Eye, 
  Edit3, 
  MessageSquare, 
  ClipboardList, 
  Volume2,
  ChevronDown,
} from 'lucide-react';

/**
 * The main header component for the application. It displays the current
 * agent's name, provides a dropdown to switch between agents, and contains
 * controls for accessing user settings, the debug log, and help.
 */
export default function Header() {
  const {
    showUserConfig,
    setShowUserConfig,
    setShowDebugModal,
    setShowAgentEdit,
    changeCount,
    theme,
    mainTab,
    setMainTab,
    documentTab,
    setDocumentTab,
    outputModality,
    setOutputModality,
  } = useUI();
  const { name } = useUser();
  const { current, setCurrent, availablePresets } = useAgent();
  const { disconnect } = useLiveAPIContext();

  // State to manage the visibility of dropdowns.
  const [showRoomList, setShowRoomList] = useState(false);
  const [showOutputMenu, setShowOutputMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  
  const outputMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside.
  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      setShowRoomList(false);
      if (outputMenuRef.current && !outputMenuRef.current.contains(e.target as Node)) {
        setShowOutputMenu(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false);
      }
    };
    addEventListener('click', closeDropdowns);
    return () => removeEventListener('click', closeDropdowns);
  }, []);

  /**
   * Handles changing the current agent.
   */
  function changeAgent(agent: Agent | string) {
    disconnect();
    setCurrent(agent);
  }

  const getOutputLabel = () => {
    switch (outputModality) {
      case 'audio': return 'Audio';
      case 'text': return 'Text';
      case 'both': return 'Both';
      default: return 'Output';
    }
  };

  const getViewLabel = () => {
    if (mainTab === 'document') {
      return documentTab === 'rendered' ? 'Rendered' : 'Editor';
    }
    switch (mainTab) {
      case 'transcript': return 'Transcript';
      case 'minutes': return 'Minutes';
      case 'audio-log': return 'Audio Log';
      default: return 'View';
    }
  };

  const isSuperUser = name === 'Root' || name === 'root';

  return (
    <header>
      <div className="roomInfo">
        <div className="roomName">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowRoomList(!showRoomList);
            }}
          >
            <h1 className={c({ active: showRoomList })}>
              {current.name.split(' (')[0]}
              {isSuperUser && (
                <span
                  className="icon edit-agent-icon"
                  onClick={e => {
                    e.stopPropagation();
                    setShowAgentEdit(true);
                  }}
                  role="button"
                  tabIndex={0}
                  title="Edit agent"
                >
                  edit
                </span>
              )}
              <span className="icon">arrow_drop_down</span>
            </h1>
          </button>
        </div>

        {/* The agent selection dropdown list */}
        <div className={c('roomList', { active: showRoomList })}>
          <div>
            <ul>
              {availablePresets
                .filter(agent => agent.id !== current.id)
                .map(agent => (
                  <li
                    key={agent.name}
                    className={c({ active: agent.id === current.id })}
                  >
                    <button onClick={() => changeAgent(agent)}>
                      {agent.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Output Menu Dropdown */}
        <div className="header-menu-container">
          <span className="header-menu-title">Output:</span>
          <div className="header-menu-wrapper" ref={outputMenuRef}>
            <button 
              className={c('header-menu-trigger', { active: showOutputMenu })}
              onClick={(e) => {
                e.stopPropagation();
                setShowOutputMenu(!showOutputMenu);
              }}
            >
              <div className="trigger-icon mobile-only">
                {outputModality === 'audio' && <Volume2 size={16} />}
                {outputModality === 'text' && <MessageSquare size={16} />}
                {outputModality === 'both' && (
                  <div className="flex items-center gap-0.5">
                    <Volume2 size={12} />
                    <MessageSquare size={12} />
                  </div>
                )}
              </div>
              <span className="menu-label">{getOutputLabel()}</span>
              <ChevronDown size={14} className={c('chevron', { open: showOutputMenu })} />
            </button>
            
            {showOutputMenu && (
              <div className="header-dropdown-menu">
                <button 
                  className={c('menu-item', { active: outputModality === 'audio' })}
                  onClick={() => {
                    setOutputModality('audio');
                    setShowOutputMenu(false);
                  }}
                >
                  <Volume2 size={16} />
                  <span>Audio</span>
                </button>
                <button 
                  className={c('menu-item', { active: outputModality === 'text' })}
                  onClick={() => {
                    setOutputModality('text');
                    setShowOutputMenu(false);
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Text</span>
                </button>
                <button 
                  className={c('menu-item', { active: outputModality === 'both' })}
                  onClick={() => {
                    setOutputModality('both');
                    setShowOutputMenu(false);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Volume2 size={14} />
                    <MessageSquare size={14} />
                  </div>
                  <span>Both</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Menu Dropdown */}
        <div className="header-menu-container">
          <span className="header-menu-title">View:</span>
          <div className="header-menu-wrapper" ref={viewMenuRef}>
            <button 
              className={c('header-menu-trigger', { active: showViewMenu })}
              onClick={(e) => {
                e.stopPropagation();
                setShowViewMenu(!showViewMenu);
              }}
            >
              <div className="trigger-icon mobile-only">
                {mainTab === 'document' && documentTab === 'rendered' && <Eye size={16} />}
                {mainTab === 'document' && documentTab === 'editor' && <Edit3 size={16} />}
                {mainTab === 'transcript' && <MessageSquare size={16} />}
                {mainTab === 'minutes' && <ClipboardList size={16} />}
                {mainTab === 'audio-log' && <Volume2 size={16} />}
              </div>
              <span className="menu-label">{getViewLabel()}</span>
              <ChevronDown size={14} className={c('chevron', { open: showViewMenu })} />
            </button>
            
            {showViewMenu && (
              <div className="header-dropdown-menu">
                <button 
                  className={c('menu-item', { active: mainTab === 'document' && documentTab === 'rendered' })}
                  onClick={() => {
                    setMainTab('document');
                    setDocumentTab('rendered');
                    setShowViewMenu(false);
                  }}
                >
                  <Eye size={16} />
                  <span>Rendered</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'document' && documentTab === 'editor' })}
                  onClick={() => {
                    setMainTab('document');
                    setDocumentTab('editor');
                    setShowViewMenu(false);
                  }}
                >
                  <Edit3 size={16} />
                  <span>Editor</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'transcript' })}
                  onClick={() => {
                    setMainTab('transcript');
                    setShowViewMenu(false);
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Transcript</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'minutes' })}
                  onClick={() => {
                    setMainTab('minutes');
                    setShowViewMenu(false);
                  }}
                >
                  <ClipboardList size={16} />
                  <span>Minutes</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'audio-log' })}
                  onClick={() => {
                    setMainTab('audio-log');
                    setShowViewMenu(false);
                  }}
                >
                  <Volume2 size={16} />
                  <span>Audio Log</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="header-controls">
        {/* Displays the number of times the model has edited the document */}
        <div className="change-counter" title="Number of edits by the model">
          <span className="change-counter-number">{changeCount}</span>
        </div>
        {/* The "Debug Log" button is a special feature, conditionally shown. */}
        {isSuperUser && (
          <button
            className="userSettingsButton"
            onClick={() => setShowDebugModal(true)}
            title="Debug Log"
          >
            <span className="icon">bug_report</span>
          </button>
        )}
        <button
          className="userSettingsButton"
          onClick={() => setShowUserConfig(!showUserConfig)}
        >
          <span className="icon">tune</span>
        </button>
      </div>
    </header>
  );
}