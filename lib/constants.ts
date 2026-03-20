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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Default Live API model to use
 */
export const DEFAULT_LIVE_API_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const FONT_OPTIONS = [
  'Rajdhani',
  'Orbitron',
  'Space Grotesk',
  'Space Mono',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Playfair Display',
  'Merriweather',
  'Arial',
  'Verdana',
  'Georgia',
  'Times New Roman',
  'Courier New',
];

export const PLACEHOLDER_DOC = 'As you talk, your AI co-founder will draft your business plan, pitch deck, or strategy here...';

export const DOCUMENT_TEMPLATES = [
  {
    id: 'pitch-deck',
    name: 'Investor Pitch Deck',
    description: 'A standard 10-slide structure for pitching to investors.',
    content: `# Investor Pitch Deck Outline\n\n## 1. The Problem\nDescribe the pain point you are solving.\n\n## 2. The Solution\nHow your product solves this problem.\n\n## 3. Market Size\nTAM, SAM, and SOM analysis.\n\n## 4. Business Model\nHow you make money.\n\n## 5. Proprietary Tech / Magic\nWhat makes your solution unique?\n\n## 6. Competition\nYour competitive landscape.\n\n## 7. Marketing & Sales\nYour go-to-market strategy.\n\n## 8. Team\nWhy you are the right people to build this.\n\n## 9. Financial Projections\n3-5 year forecast.\n\n## 10. The Ask\nWhat you need from investors.`
  },
  {
    id: 'prd',
    name: 'Product Requirement Document (PRD)',
    description: 'Detailed specifications for a new feature or product.',
    content: `# Product Requirement Document: [Feature Name]\n\n## 1. Executive Summary\nBrief overview of the feature and its value.\n\n## 2. Goals & Objectives\nWhat are we trying to achieve?\n\n## 3. User Stories\n- As a [user], I want to [action] so that [benefit].\n\n## 4. Functional Requirements\n- Requirement 1...\n- Requirement 2...\n\n## 5. Non-Functional Requirements\nPerformance, security, etc.\n\n## 6. User Interface & UX\nDescription of the flow and key screens.\n\n## 7. Success Metrics\nHow will we measure success?`
  },
  {
    id: 'lean-canvas',
    name: 'Lean Canvas',
    description: 'A 1-page business plan for rapid validation.',
    content: `# Lean Canvas\n\n### Problem\nList the top 3 problems.\n\n### Solution\nTop 3 features.\n\n### Unique Value Proposition\nSingle, clear, compelling message.\n\n### Unfair Advantage\nSomething that cannot be easily copied or bought.\n\n### Customer Segments\nTarget customers.\n\n### Key Metrics\nKey activities you measure.\n\n### Channels\nPath to customers.\n\n### Cost Structure\nCustomer acquisition costs, distribution costs, etc.\n\n### Revenue Streams\nRevenue model, life-time value, etc.`
  },
  {
    id: 'faq',
    name: 'Product FAQ',
    description: 'Common questions and answers for your customers.',
    content: `# Product FAQ\n\n## General Questions\n\n### What is [Product Name]?\nAnswer here...\n\n### How do I get started?\nAnswer here...\n\n## Pricing & Billing\n\n### How much does it cost?\nAnswer here...\n\n### Do you offer a free trial?\nAnswer here...\n\n## Technical Support\n\n### Is my data secure?\nAnswer here...\n\n### How do I contact support?\nAnswer here...`
  }
];
