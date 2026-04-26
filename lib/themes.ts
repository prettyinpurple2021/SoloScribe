/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Defines the structure for a theme object.
 * The `colors` array corresponds to CSS variables:
 * [bg, surface, accent, text, document-bg]
 */
export type Theme = {
  name: string;
  colors: [string, string, string, string, string];
};

export type ExportTheme = {
  name: string;
  font: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  shadow: string;
  footer: string;
};

/**
 * An array of available themes for the application.
 */
export const themes: Theme[] = [
  {
    name: 'SoloScribe',
    colors: ['#F5F5F0', '#FFFFFF', '#00f3ff', '#000000', '#FFFFFF'],
  }
];

export const exportThemes: Record<string, ExportTheme> = {
  brutalist: {
    name: 'Neo-Brutalist',
    font: 'Rajdhani',
    borderColor: '#000000',
    borderWidth: '4px',
    borderRadius: '0px',
    shadow: '8px 8px 0px #000000',
    footer: 'PROCESSED_BY_SOLOSCRIBE_BRAIN'
  },
  corporate: {
    name: 'Executive Classic',
    font: 'Georgia',
    borderColor: '#e5e7eb',
    borderWidth: '1px',
    borderRadius: '8px',
    shadow: 'none',
    footer: 'Confidential Business Document - Produced by SoloScribe'
  },
  modern: {
    name: 'Tech Modern',
    font: 'Inter',
    borderColor: '#3b82f6',
    borderWidth: '2px',
    borderRadius: '12px',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    footer: 'Powered by SoloScribe // Future-Proof Strategy'
  }
};
