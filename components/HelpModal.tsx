/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import Modal from './Modal';
import { useUI } from '../lib/state';
import { PlayCircle, Sparkles } from 'lucide-react';

/**
 * A modal component that displays a comprehensive help guide for the user.
 * It explains the core features of the application, such as session setup,
 * conversational interaction, document management, and reviewing the session.
 */
export default function HelpModal() {
  const { setShowHelpModal, setShowTutorial, setTutorialStep } = useUI();

  function onClose() {
    setShowHelpModal(false);
  }

  const handleStartTour = () => {
    setShowHelpModal(false);
    setTutorialStep(0);
    setShowTutorial(true);
  };

  return (
    <Modal onClose={onClose} className="help-modal-container" title="Operational Manual">
      <div className="help-modal-content">
        
        <div className="help-section prominent-section bg-theme-accent/5 p-6 border-2 border-theme-accent mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-theme-accent mb-2">New to SoloScribe?</h3>
              <p className="text-sm opacity-80">Take a guided tour of the interface to learn about key features and co-founder interaction.</p>
            </div>
            <button 
              onClick={handleStartTour}
              className="brutalist-button whitespace-nowrap"
            >
              <Sparkles size={18} />
              START TOUR
            </button>
          </div>
        </div>

        <div className="help-section">
          <h3>Getting Started</h3>
          <p>
            Before you begin, it's a good idea to set up your session. Use the controls in the header to:
          </p>
          <ul>
            <li>
              <strong>
                <span className="icon icon-in-text">tune</span>Settings:
              </strong>{' '}
              Set your name, define the topic, upload <strong>PDF documents</strong> for context, and add background info for your co-founder.
            </li>
            <li>
              <strong>Live API Model:</strong> Choose between different model versions (e.g., <strong>09-2025</strong> or <strong>12-2025</strong>) in the Settings menu to find the best performance for your session.
            </li>
            <li>
              <strong>Output Menu:</strong> Choose how your co-founder responds—via <strong>Audio</strong>, <strong>Text</strong> (speech bubbles), or <strong>Both</strong>.
            </li>
            <li>
              <strong>View Menu:</strong> Quickly switch between the <strong>Editor</strong>, <strong>Rendered</strong> preview, <strong>Transcript</strong>, <strong>Minutes</strong>, and <strong>Audio Log</strong>.
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h3>The Basics: Just Talk!</h3>
          <p>
            SoloScribe is designed to be a conversation. To start the session, click
            the large <strong>Play button</strong> at the bottom of the screen.
            Your microphone will become active.
          </p>
          <ul>
            <li>
              <strong>Start Speaking:</strong> Simply start talking about your
              topic. As you speak, your co-founder will listen and begin drafting the
              document in real-time.
            </li>
            <li>
              <strong>Collaborate:</strong> Your co-founder will ask questions to
              clarify details and guide the writing process. Respond as if
              you're talking to a creative partner.
            </li>
            <li>
              <strong>Google Search:</strong> SoloScribe can now access the web in 
              real-time. Ask for current events, factual data, or advanced 
              research. Your co-founder will notify you when it uses <strong>Google Search</strong> 
              to ground its responses in fresh information and maintain consistency across turns.
            </li>
            <li>
              <strong>Proactive Updates:</strong> After updating the document, your 
              co-founder will concisely explain what was added or changed, ensuring 
              you're always in the loop with the creative process.
            </li>
            <li>
              <strong>Add Images, Diagrams & Graphs:</strong> Ask your co-founder to add an
              "illustration of a..." or a "diagram of...". You can also ask for 
              <strong> mathematical graphs</strong> (e.g., "plot sin(x) and cos(x)"). 
              Your co-founder uses the powerful Nano Banana Pro model for visuals and a 
              high-performance plotting engine for interactive math.
            </li>
            <li>
              <strong>Mute/Unmute:</strong> You can click the{' '}
              <strong>
                <span className="icon icon-in-text">mic</span>Microphone button
              </strong>{' '}
              to mute or unmute yourself at any time.
            </li>
            <li>
              <strong>Pause Session:</strong> Click the{' '}
              <strong>
                <span className="icon icon-in-text">pause</span>Pause button
              </strong>{' '}
              to end the session.
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h3>The Document View</h3>
          <p>
            This is the main area where your collaborative document takes shape.
            On mobile, this tab is labeled <strong>"Doc"</strong>.
          </p>
          <ul>
            <li>
              <strong>Editor Tab:</strong> This is a live text area where you can
              jump in and type, delete, or rephrase anything at any time. The
              co-founder will see your changes and adapt.
            </li>
            <li>
              <strong>Editor Toolbar:</strong> Use the{' '}
              <strong>Undo/Redo</strong> buttons to navigate your edit history, 
              the <strong>Font Selector</strong> to change the document's appearance, 
              and the <strong>Download</strong> buttons to save the
              document as a Markdown, HTML, Text, or <strong>Professional PDF</strong> file.
            </li>
            <li>
              <strong>Rendered Tab:</strong> See a clean, formatted preview of
              your document. Use the{' '}
              <strong>
                <span className="icon icon-in-text">content_copy</span>Copy
              </strong>{' '}
              button (which appears as an icon-only on mobile) to copy the
              document with its formatting preserved.
            </li>
            <li>
              <strong>Resize Images, Maps & Graphs:</strong> In the 'Rendered' view, you
              can click and drag the handle in the bottom-right corner of any
              image, map, or graph to resize it to your liking.
            </li>
            <li>
              <strong>Interactive Graphs:</strong> Mathematical plots are fully 
              interactive. Use your mouse scroll wheel to <strong>zoom</strong> in and out, 
              and click-and-drag the plot area to <strong>pan</strong> across the coordinate plane.
            </li>
            <li>
              <strong>Professional Math Typesetting:</strong> SoloScribe now supports 
              full LaTeX for both the document and graph legends, ensuring 
              professional-grade mathematical notation (e.g., $\int f(x) dx$).
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h3>Reviewing Your Session</h3>
          <p>
            You have a few ways to review your conversation. On smaller screens,
            these tab labels may be abbreviated (e.g., "Doc", "Audio").
          </p>
          <ul>
            <li>
              <strong>Transcript:</strong> A raw, word-for-word transcript of
              the conversation. You can generate an <strong>Accurate Transcript</strong> 
              which uses advanced audio analysis to correct errors, and then click 
              <strong>"Replace Live Transcript"</strong> to update your records.
            </li>
            <li>
              <strong>Minutes:</strong> A cleaned-up, summarized version of the
              transcript, corrected by an LLM for better readability and to
              serve as meeting minutes.
            </li>
            <li>
              <strong>Audio Log:</strong> Listen back to individual audio clips
              from your session or use the <strong>Save Audio Log</strong>{' '}
              button to download the entire conversation as a single WAV file.
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h3>Changing Your Co-founder</h3>
          <p>
            You can change the personality of your InkLo at any time. Click
            the <strong>Co-founder's Name</strong> in the top-left corner to choose
            from a list of different creative partners, including specialized 
            co-founders for <strong>Financials (Newton)</strong>, and multi-lingual experts 
            for <strong>Hindi (Rahul)</strong>, <strong>Spanish (Ramon)</strong>, 
            <strong>French (Amelie)</strong>, <strong>Hebrew (Ari)</strong>, 
            <strong>Chinese (Mei)</strong>, <strong>Japanese (Hiro)</strong>, 
            <strong>Korean (Ji-won)</strong>, <strong>German (Hans)</strong>, 
            <strong>Turkish (Defne)</strong>, <strong>Arabic (Karim)</strong>, 
            <strong>Farsi (Reza)</strong>, <strong>Portuguese (Inês)</strong>, 
            <strong>Russian (Olga)</strong>, and <strong>Italian (Luca)</strong>.
          </p>
        </div>

        <div className="help-section">
          <h3>Super User Mode</h3>
          <p>
            For advanced users and developers, entering the name <strong>"Root"</strong> 
            or <strong>"root"</strong> in the Settings menu unlocks 
            <strong> Super User Mode</strong>. This enables:
          </p>
          <ul>
            <li>
              <strong>Debug Log:</strong> Access detailed system logs and API 
              performance metrics via the bug icon in the header.
            </li>
            <li>
              <strong>Prompt Editing:</strong> Click the pencil icon next to the 
              co-founder's name to view and modify the underlying system instructions 
              for the current agent.
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h3>The Floating Avatar</h3>
          <p>
            The floating circle is a visual indicator for your co-founder. It will
            animate when your co-founder is "thinking" or speaking. You can also
            click and drag it to move it anywhere you'd like on the screen. 
            On mobile, it starts in the top-right corner for better visibility.
          </p>
        </div>
        <div className="help-modal-version">v5.5</div>
      </div>
    </Modal>
  );
}
