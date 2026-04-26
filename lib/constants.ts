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

export const PLACEHOLDER_DOC = 'As you talk, your InkLo will draft your business plan, pitch deck, or strategy here...';

export const DOCUMENT_TEMPLATES = [
  {
    id: 'yc-app',
    name: 'Y Combinator Application',
    description: 'A comprehensive draft for the YC application process.',
    content: `
# Y Combinator Application Draft

## 1. Company Information
- Company name: 
- Company url: 
- Describe what your company does in 50 characters or less: 

## 2. Team
- Founders: 
- Why did you pick this idea to work on? Do you have domain expertise?
- How long have the founders known one another and how did they meet?

## 3. Product
- What are you building?
- How far along are you?
- If you have already started working on it, how long have you been working and how many lines of code (if applicable) have you written?

## 4. Market
- Who are your competitors?
- What do you understand about your business that other companies in it just don't get?
- How do you make money?

## 5. Traction
- Do you have revenue?
- How many users do you have?
`
  },
  {
    id: 'lean-canvas',
    name: 'Lean Canvas',
    description: 'A 1-page business plan for rapid validation.',
    content: `
# Lean Canvas

## 1. Problem
List your top 1-3 problems.
- 

**Existing Alternatives:** How are these problems solved today?

## 2. Customer Segments
List your target customers and users.
- 

**Early Adopters:** Who are your ideal early adopters?

## 3. Unique Value Proposition
Single, clear, compelling message that states why you are different and worth paying attention to.
- 

## 4. Solution
Outline a possible solution for each problem.
- 

## 5. Channels
List your path to customers (inbound or outbound).
- 

## 6. Revenue Streams
List your sources of revenue.
- 

## 7. Cost Structure
List your fixed and variable costs.
- 

## 8. Key Metrics
List the key numbers that tell you how your business is doing.
- 

## 9. Unfair Advantage
Something that cannot be easily copied or bought.
- 
`
  },
  {
    id: 'prd',
    name: 'Product Requirement Document (PRD)',
    description: 'Detailed specifications for a new feature or product.',
    content: `
# Product Requirements Document (PRD)

## 1. Overview
Describe the goal and purpose of this product or feature.

## 2. Target Audience
Who is this for?

## 3. User Stories
- As a [type of user], I want to [action] so that [benefit/value].

## 4. Key Features & Requirements
| Feature | Priority (P0, P1, P2) | Description |
|---|---|---|
| | | |

## 5. Out of Scope
What are we NOT building?

## 6. Milestones & Timeline
- [ ] Phase 1: 
- [ ] Phase 2: 

## 7. Success Metrics
How do we know this is successful? (KPIs)
`
  },
  {
    id: 'one-pager',
    name: 'Investor One-Pager',
    description: 'A 1-page summary of your business for investors.',
    content: `
# Investor One-Pager

## Overview
**Company:** 
**Elevator Pitch:** 

## The Problem
What pain point are you solving?

## The Solution
How does your product solve it?

## Market Opportunity
TAM, SAM, SOM.

## Traction
Current revenue, users, or key milestones.

## Team
Brief bios of key founders and why they are the right people.

## The Ask
How much are you raising and what are the primary use cases for the funds?
`
  },
  {
    id: 'pitch-deck',
    name: 'Investor Pitch Deck Outline',
    description: 'A standard 10-slide structure for pitching.',
    content: `# Investor Pitch Deck Outline\n\n## 1. The Problem\nDescribe the pain point you are solving.\n\n## 2. The Solution\nHow your product solves this problem.\n\n## 3. Market Size\nTAM, SAM, and SOM analysis.\n\n## 4. Business Model\nHow you make money.\n\n## 5. Proprietary Tech / Magic\nWhat makes your solution unique?\n\n## 6. Competition\nYour competitive landscape.\n\n## 7. Marketing & Sales\nYour go-to-market strategy.\n\n## 8. Team\nWhy you are the right people to build this.\n\n## 9. Financial Projections\n3-5 year forecast.\n\n## 10. The Ask\nWhat you need from investors.`
  }
];
