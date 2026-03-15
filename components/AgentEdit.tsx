/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState } from 'react';
import {
  Agent,
  INTERLOCUTOR_VOICE,
  INTERLOCUTOR_VOICES,
} from '../lib/presets/agents';
import Modal from './Modal';
import { useAgent, useUI } from '../lib/state';

/**
 * A modal component for editing the properties of the currently active agent.
 * It allows changing the agent's name, personality prompt, and voice in a
 * streamlined, text-focused interface.
 */
export default function EditAgent() {
  // Fetches the current agent's data and the function to update it from the Zustand store.
  const agent = useAgent(state => state.current);
  const updateAgent = useAgent(state => state.update);
  const nameInput = useRef(null);
  // Fetches the function to control the visibility of this modal from the UI store.
  const { setShowAgentEdit } = useUI();

  // Local state for form fields
  const [name, setName] = useState(agent.name);
  const [voice, setVoice] = useState<INTERLOCUTOR_VOICE>(agent.voice);
  const [personality, setPersonality] = useState(agent.personality);

  /**
   * Closes the agent editing modal.
   */
  function onClose() {
    setShowAgentEdit(false);
  }

  /**
   * Handles form submission to update the global agent state.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateAgent(agent.id, { name, voice, personality });
    onClose();
  }

  return (
    <Modal onClose={() => onClose()} className="agent-edit-modal">
      <form
        className="edit-agent-form"
        onSubmit={handleSubmit}
      >
        <div className="agent-edit-header">
          <div className="config-field name-field">
            <label>Name</label>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              ref={nameInput}
              className="header-input"
            />
          </div>
          <div className="config-field voice-field">
            <label>Voice</label>
            <select
              value={voice}
              onChange={e => setVoice(e.target.value as INTERLOCUTOR_VOICE)}
              className="header-input"
            >
              {INTERLOCUTOR_VOICES.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button primary done-button">
            Done
          </button>
        </div>

        <div className="agent-personality">
          <div className="personality-header">
            <label>Personality</label>
            <span className="char-counter">{personality.length} characters</span>
          </div>
          <textarea
            value={personality}
            onChange={e => setPersonality(e.target.value)}
            placeholder="How should this assistant act? What is its purpose?"
          />
        </div>
      </form>
    </Modal>
  );
}