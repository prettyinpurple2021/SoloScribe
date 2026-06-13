# 🗺️ Codebase Map & Software Architecture Guide

Welcome to the **SoloScribe Core System Architecture Manual**. This document is designed for developers inheriting this codebase to easily understand, modify, and scale **SoloScribe V5**—an AI-native strategic co-pilot optimized for solo founders and lean teams.

---

## 📂 Visual Directory Map

Here is the high-level tree representing the entire codebase organization:

```text
soloscribe/
├── App.tsx                     # Primary Shell, Navigation Tab Router, User Settings togglers
├── index.html                  # Browser Page Template Frame
├── tsconfig.json               # TypeScript Compiler Configuration rules
├── vite.config.ts              # Vite Asset Builder & Server config
├── package.json                # Runtime NPM Packages & Core Script bindings
│
├── components/                 # UI View System and Interaction Components
│   ├── LandingPage.tsx         # Neo-brutalist Home Landing Page presenting MVP capabilities
│   ├── WelcomeScreen.tsx       # "Strategic Core" brain-dump console (Chaos-to-Strategy Engine)
│   ├── Onboarding.tsx          # Interactive intro step flow presenting Inklo's purpose
│   ├── FeatureTour.tsx         # Pop-up guidance overlay highlighting main workflow tabs
│   ├── UserSettings.tsx        # System status logger & Notion credentials connection interface
│   ├── Inklo.tsx               # Beautiful vector animation of our metallic yellow mascot
│   ├── InkloChatbot.tsx        # Persistent floating sidekick with dual AI & Offline advice modes
│   │
│   ├── auth/                   # Identity Validation Modules
│   │   ├── LoginCard.tsx       # Secure access controller UI
│   │   └── AuthGuard.tsx       # Route protection components
│   │
│   ├── Legal/                  # Compliance and Policy details
│   │   ├── PolicyFrame.tsx     # Standard GDPR privacy compliance container
│   │   └── TermsSheet.tsx      # Standard user terms details
│   │
│   └── workspace/              # Business Strategy Sandboxes (Tab Components)
│       ├── KeynoteCompanion.tsx # Pitch Narrative Refiner & Multi-Target Exporters
│       ├── StrategyVaultTab.tsx # Historical generated Strategy cards database visualizer
│       ├── MonetizationTab.tsx  # Dynamic MRR/ARR/LTV sandbox with Recharts visualization
│       ├── ComplianceTab.tsx   # Interactive CCPA/GDPR checklist & sovereignty scorer
│       ├── AIAuditorTab.tsx     # Startup Pivot & Competitor stress-test console
│       ├── RoadmapTab.tsx       # Timeline generator and visual milestones card tracker
│       └── CommunityTab.tsx     # Simulated encrypted peer milestones logging board
│
├── lib/                        # Underlying Operations and Integration Core
│   ├── ai-tools.ts             # Gemini Models Connection Framework (deep-think & lite models)
│   ├── state.ts                # App State Management (Zustand configuration with persistency)
│   ├── firebase.ts             # Firestore connection setup and secure configuration parameters
│   └── notion.ts               # Notion Bridge API block compiler, Markdown parser, and proxy
```

---

## 🏗️ Architecture & Component Roles

### 1. The Core Orchestrator (Shell)
*   **`App.tsx`**: The root manager of the client. It handles the outer border styling, tab routers, authentication guards, loading overlays, onboarding initializers, and triggers the floating **Inklo Chatbot** overlay on the bottom right.

### 2. Strategic Brain Console
*   **`components/WelcomeScreen.tsx`**: This is where founders dump raw chaotic thoughts.
    *   *Features*: Live voice-to-text recording simulators, preset strategic frameworks (SWOT, Lean Canvas, MoSCoW, Value Proposition Matrix), and a direct connection to the Gemini API (`thinkDeeply` reasoning tool).
    *   *Saves*: Automatically structures output files and saves them to the Firebase Firestore collections.

### 3. Deep-Thinking Workbenches (`components/workspace/`)
*   **`KeynoteCompanion.tsx`**: Receives raw output from the Strategy Engine and packages it into board-ready presentation narratives or slide copy.
    *   *Extending Portability*: Includes offline-compatible target-specific file exports for **Obsidian** wikis, **GitHub** issue issue-checklists, and **Trello** JSON importing lists.
*   **`StrategyVaultTab.tsx`**: Integrates with Firestore to serve as a secure historical filing cabinet. Built with notebook-style side rings, it allows downloading and reloading past plans.
*   **`MonetizationTab.tsx`**: Dynamic revenue engine built using **Recharts**. Sliders dynamically modify calculated SaaS metrics based on standard mathematical systems:
    $$\text{MRR} = \text{Traffic} \times \left(\frac{\text{Conversion Rate}}{100}\right) \times \text{ARPU}$$
    $$\text{ARR} = \text{MRR} \times 12$$
    $$\text{LTV} = \frac{\text{ARPU}}{\text{Churn Rate} / 100}$$
*   **`ComplianceTab.tsx`**: Evaluates business compliance postures based on selected regions (GDPR, CCPA, LGPD) and active vendor options, providing responsive legal hygiene advice.
*   **`AIAuditorTab.tsx`**: Performs competitive evaluation. Founders input details about rivals to trigger custom AI audits containing strategic defenses.

---

## 💾 Client State Engine & Database Synchronization

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                      ZUSTAND STORE                          │
  │  (manages local auth, active tabs, settings, notion tokens)   │
  └───────────────▲─────────────────────────────▲───────────────┘
                  │ Offline States              │ Local Storage Sync
                  ▼                             ▼
  ┌───────────────────────────────┐     ┌───────────────────────┐
  │      FIREBASE FIRESTORE       │     │     LOCALSTORAGE      │
  │     (Saves Strategy Cards)    │     │  (Session Backups)    │
  └───────────────────────────────┘     └───────────────────────┘
```

The system uses a unified state architecture to keep values persistent, secure, and offline-capable:
1.  **Zustand Store (`/lib/state.ts`)**: Serves as the central state engine. It handles:
    *   Authentication states and active user models.
    *   Application configurations (Notion Tokens, active workspace indices).
    *   Onboarding checklist completion tracking.
2.  **Firebase Client (`/lib/firebase.ts`)**: Integrates directly with Firestore database collections. Strategy runs generated inside the Welcome Screen are saved under `/strategies` keyed by individual user identifiers.
3.  **Local Fallback Storage**: Essential configurations are persisted locally inside the browser memory.

---

## 🔌 Integration Gateways

### 🤖 Gemini Cognitive Layers (`/lib/ai-tools.ts`)
SoloScribe implements a modular, server-side-safe architecture to connect query prompts to generative layers:
*   **`thinkDeeply`**: Harnesses `gemini-2.0-flash-thinking-exp` for multi-step reasoning, grounding strategic recommendations directly in the founder's original core identity vectors (Why, Vision, Constraints).
*   **`quickPolish`**: Leverages `gemini-2.0-flash-lite` for high-speed editorial copy improvements and formatting actions.

### 📓 Notion Integration Bridge (`/lib/notion.ts` & `/components/UserSettings.tsx`)
Because client-side calls to the Notion API trigger CORS prevention, SoloScribe incorporates a secure CORS-proxy handler combined with a custom abstract syntax tree compiler:
1.  **`markdownToNotionBlocks`**: A custom parser that recursively converts markdown strings into styled Notion block structures (headings, callouts, lists, bullet-points).
2.  **`sendToNotion`**: Triggers a secure integration pipeline to create custom Notion pages or database rows directly inside the unified integration credentials specified in Settings.

---

## 🛠️ Next-Step Development Guidelines

Should you need to expand, refine, or add features, keep the following development principles of **SoloScribe** in mind:

1.  **Style Rules (Neo-Brutalist Y2K Theme)**: SoloScribe enforces a distinctive design aesthetic. When building new elements, utilize:
    *   Deep flat styling: Bold margins, high-contrast black borders (`border-4 border-neo-black`).
    *   Offset solid shadows (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`).
    *   Vibrant visual colors paired with neutral off-white spaces (colors like `#a3e635` - Lime, `#22d3ee` - Cyan, `#f43f5e` - Pink).
2.  **Typographical Pairings**: Ensure display headings utilize clean, sans-serif styles styled with `font-sans font-black uppercase text-neo-black tracking-tight`. Use `font-mono` exclusively for telemetry, technical statuses, and data blocks.
3.  **Safe AI Prompts**: When calling new models, always wrap prompts to reference the founder's original identity context vectors from the store to keep recommendations grounded.
