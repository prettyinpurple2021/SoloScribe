/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { Agent } from '../lib/presets/agents';
import { useAgent, useUI, useUser } from '../lib/state';
import { Tooltip } from './Tooltip';
import c from 'classnames';
import { useEffect, useState, useRef } from 'react';
import { 
  Eye, 
  Edit3, 
  MessageSquare, 
  ClipboardList, 
  CheckSquare,
  Volume2,
  ChevronDown,
  LogOut,
  LogIn,
  Wrench,
  ShieldAlert,
  LineChart,
  Map,
  FilePlus,
  Folder,
  History,
  Bug,
  Settings,
  Megaphone,
  Shield,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
    showChatHistory,
    setShowChatHistory,
    resetDocument,
    showProjectSidebar,
    setShowProjectSidebar,
  } = useUI();
  const { name, resetUser, profilePicture } = useUser();
  const { current, setCurrent, availablePresets, update: updateAgent } = useAgent();
  const { disconnect } = useLiveAPIContext();
  const { user, signIn, signOut } = useAuth();

  // State to manage the visibility of dropdowns.
  const [showRoomList, setShowRoomList] = useState(false);
  const [showOutputMenu, setShowOutputMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showPromptMenu, setShowPromptMenu] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(current.personality);
  
  const outputMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const promptMenuRef = useRef<HTMLDivElement>(null);
  const confirmNewRef = useRef<HTMLDivElement>(null);

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
      if (promptMenuRef.current && !promptMenuRef.current.contains(e.target as Node)) {
        setShowPromptMenu(false);
      }
      if (confirmNewRef.current && !confirmNewRef.current.contains(e.target as Node)) {
        setShowConfirmNew(false);
      }
    };
    addEventListener('click', closeDropdowns);
    return () => removeEventListener('click', closeDropdowns);
  }, []);

  // Update tempPrompt when current agent changes
  useEffect(() => {
    setTempPrompt(current.personality);
  }, [current.personality]);

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
      case 'chatbot': return 'Chatbot';
      case 'tools': return 'AI Tools';
      case 'validation': return 'Evidence Locker';
      case 'projections': return 'Projections';
      case 'roadmap': return 'Roadmap';
      case 'tasks': return 'Tasks';
      case 'marketing': return 'Marketing Kit';
      case 'compliance': return 'Compliance';
      case 'monetization': return 'Monetization';
      default: return 'View';
    }
  };

  const isSuperUser = name === 'Root' || name === 'root';

  return (
    <header className="paper-dots">
      <div className="roomInfo">
        <Tooltip content="Open Workspace" position="right">
          <button 
            id="tour-workspace"
            className={c('workspace-toggle userSettingsButton', { active: showProjectSidebar })}
            onClick={() => setShowProjectSidebar(!showProjectSidebar)}
          >
            <Folder size={20} />
          </button>
        </Tooltip>
        <div className="roomName">
          <Tooltip content="Switch InkLo Version" position="bottom">
            <button
              onClick={e => {
                e.stopPropagation();
                setShowRoomList(!showRoomList);
              }}
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <h1 className={c({ active: showRoomList })}>
                {current.name}
                {isSuperUser && (
                  <span
                    className="edit-agent-icon"
                    onClick={e => {
                      e.stopPropagation();
                      setShowAgentEdit(true);
                    }}
                    role="button"
                    tabIndex={0}
                    style={{ marginLeft: '8px', display: 'flex', alignItems: 'center' }}
                  >
                    <Edit3 size={16} />
                  </span>
                )}
                <ChevronDown size={20} style={{ marginLeft: '4px' }} />
              </h1>
            </button>
          </Tooltip>
        </div>

        {/* The agent selection dropdown list */}
        <div className={c('roomList', { active: showRoomList })}>
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ padding: '8px 16px', fontSize: '11px', color: '#666', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Specialists
            </div>
            <ul>
              {availablePresets
                .filter(agent => !['rahul', 'ramon', 'amelie', 'ari', 'mei', 'hiro', 'jiwon', 'hans', 'defne', 'karim', 'reza', 'ines', 'olga', 'luca'].includes(agent.id) && agent.id !== current.id)
                .map(agent => (
                  <li
                    key={agent.id}
                    className={c({ active: agent.id === current.id })}
                  >
                    <button onClick={() => changeAgent(agent)}>
                      {agent.name}
                    </button>
                  </li>
                ))}
            </ul>
            
            <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: '#666', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase', borderTop: '2px solid #eee', marginTop: '4px' }}>
              Languages
            </div>
            <ul>
              {availablePresets
                .filter(agent => ['rahul', 'ramon', 'amelie', 'ari', 'mei', 'hiro', 'jiwon', 'hans', 'defne', 'karim', 'reza', 'ines', 'olga', 'luca'].includes(agent.id) && agent.id !== current.id)
                .map(agent => (
                  <li
                    key={agent.id}
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
            <Tooltip content="Select output modality (Audio, Text, or Both)" position="bottom">
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
            </Tooltip>
            
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
        <div className="header-menu-container" id="tour-view-menu">
          <span className="header-menu-title">View:</span>
          <div className="header-menu-wrapper" ref={viewMenuRef}>
            <Tooltip content="Change current view" position="bottom">
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
                  {mainTab === 'chatbot' && <MessageSquare size={16} />}
                  {mainTab === 'tools' && <Wrench size={16} />}
                  {mainTab === 'validation' && <ShieldAlert size={16} />}
                  {mainTab === 'projections' && <LineChart size={16} />}
                  {mainTab === 'roadmap' && <Map size={16} />}
                  {mainTab === 'tasks' && <CheckSquare size={16} />}
                  {mainTab === 'marketing' && <Megaphone size={16} />}
                  {mainTab === 'compliance' && <Shield size={16} />}
                  {mainTab === 'monetization' && <DollarSign size={16} />}
                </div>
                <span className="menu-label">{getViewLabel()}</span>
                <ChevronDown size={14} className={c('chevron', { open: showViewMenu })} />
              </button>
            </Tooltip>
            
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
                <button 
                  className={c('menu-item', { active: mainTab === 'chatbot' })}
                  onClick={() => {
                    setMainTab('chatbot');
                    setShowViewMenu(false);
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Chatbot</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'tools' })}
                  onClick={() => {
                    setMainTab('tools');
                    setShowViewMenu(false);
                  }}
                >
                  <Wrench size={16} />
                  <span>AI Tools</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'validation' })}
                  onClick={() => {
                    setMainTab('validation');
                    setShowViewMenu(false);
                  }}
                >
                  <ShieldAlert size={16} />
                  <span>Evidence Locker</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'projections' })}
                  onClick={() => {
                    setMainTab('projections');
                    setShowViewMenu(false);
                  }}
                >
                  <LineChart size={16} />
                  <span>Projections</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'roadmap' })}
                  onClick={() => {
                    setMainTab('roadmap');
                    setShowViewMenu(false);
                  }}
                >
                  <Map size={16} />
                  <span>Roadmap</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'tasks' })}
                  onClick={() => {
                    setMainTab('tasks');
                    setShowViewMenu(false);
                  }}
                >
                  <CheckSquare size={16} />
                  <span>Tasks</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'marketing' })}
                  onClick={() => {
                    setMainTab('marketing');
                    setShowViewMenu(false);
                  }}
                >
                  <Megaphone size={16} />
                  <span>Marketing Kit</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'compliance' })}
                  onClick={() => {
                    setMainTab('compliance');
                    setShowViewMenu(false);
                  }}
                >
                  <Shield size={16} />
                  <span>Compliance</span>
                </button>
                <button 
                  className={c('menu-item', { active: mainTab === 'monetization' })}
                  onClick={() => {
                    setMainTab('monetization');
                    setShowViewMenu(false);
                  }}
                >
                  <DollarSign size={16} />
                  <span>Monetization</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Prompt Menu Dropdown */}
        <div className="header-menu-container">
          <span className="header-menu-title">Prompt:</span>
          <div className="header-menu-wrapper" ref={promptMenuRef}>
            <Tooltip content="Edit the agent's system prompt" position="bottom">
              <button 
                className={c('header-menu-trigger', { active: showPromptMenu })}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromptMenu(!showPromptMenu);
                }}
              >
                <div className="trigger-icon mobile-only">
                  <Edit3 size={16} />
                </div>
                <span className="menu-label">Edit Prompt</span>
                <ChevronDown size={14} className={c('chevron', { open: showPromptMenu })} />
              </button>
            </Tooltip>
            
            {showPromptMenu && (
              <div className="header-dropdown-menu prompt-dropdown-menu" style={{ width: '400px', padding: '12px' }}>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <textarea
                    value={tempPrompt}
                    onChange={(e) => setTempPrompt(e.target.value)}
                    placeholder="Enter system prompt..."
                    className="brutalist-textarea"
                    style={{
                      width: '100%',
                      height: '200px',
                      fontSize: '13px',
                      lineHeight: '1.5'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '12px',
                    fontSize: '10px',
                    color: 'var(--theme-accent)',
                    opacity: 0.7,
                    fontFamily: 'var(--font-mono)',
                    pointerEvents: 'none'
                  }}>
                    {tempPrompt.length.toLocaleString()} chars
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--theme-text)', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                    SYSTEM_PROMPT_V2.0
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setTempPrompt(current.personality);
                        setShowPromptMenu(false);
                      }}
                      className="brutalist-button-outline"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                      }}
                    >
                      ABORT
                    </button>
                    <button
                      onClick={() => {
                        updateAgent(current.id, { personality: tempPrompt });
                        setShowPromptMenu(false);
                        // Disconnect to force the new prompt to take effect on next connection
                        disconnect();
                      }}
                      className="brutalist-button"
                      style={{
                        padding: '6px 16px',
                        fontSize: '12px',
                      }}
                    >
                      SAVE & RESTART
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="header-controls">
        <div className="header-menu-wrapper" ref={confirmNewRef}>
          <Tooltip content="New Document" position="bottom">
            <button
              className={c('header-menu-trigger', { active: showConfirmNew })}
              onClick={() => setShowConfirmNew(!showConfirmNew)}
            >
              <FilePlus size={16} />
              <span className="menu-label">New</span>
            </button>
          </Tooltip>
          
          {showConfirmNew && (
            <div className="header-dropdown-menu" style={{ right: 0, left: 'auto', width: '220px', padding: '16px' }}>
              <p style={{ fontSize: '13px', marginBottom: '16px', color: 'var(--theme-text)', lineHeight: '1.4' }}>
                Create a new document? This will clear the current content and transcript.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setShowConfirmNew(false)}
                  className="brutalist-button-outline"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetDocument();
                    resetUser();
                    setShowConfirmNew(false);
                  }}
                  className="brutalist-button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                  }}
                >
                  Create New
                </button>
              </div>
            </div>
          )}
        </div>
        {user ? (
          <Tooltip content="Sign Out" position="bottom">
            <button
              className="userSettingsButton"
              onClick={signOut}
            >
              <LogOut size={20} />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Sign In" position="bottom">
            <button
              className="userSettingsButton"
              onClick={signIn}
            >
              <LogIn size={20} />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Toggle Chat History" position="bottom">
          <button
            className={c('userSettingsButton', { active: showChatHistory })}
            onClick={() => setShowChatHistory(!showChatHistory)}
          >
            <History size={20} />
          </button>
        </Tooltip>
        {/* Displays the number of times the model has edited the document */}
        <Tooltip content="Number of edits by the model" position="bottom">
          <div className="change-counter">
            <span className="change-counter-number">{changeCount}</span>
          </div>
        </Tooltip>
        {/* The "Debug Log" button is a special feature, conditionally shown. */}
        {isSuperUser && (
          <Tooltip content="Debug Log" position="bottom">
            <button
              className="userSettingsButton"
              onClick={() => setShowDebugModal(true)}
            >
              <Bug size={20} />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Settings" position="bottom">
          <button
            id="tour-settings"
            className={c('userSettingsButton', { active: showUserConfig })}
            onClick={() => setShowUserConfig(!showUserConfig)}
            style={{ padding: profilePicture ? '0' : undefined, overflow: 'hidden' }}
          >
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            ) : (
              <Settings size={20} />
            )}
          </button>
        </Tooltip>
      </div>
    </header>
  );
}