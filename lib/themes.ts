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

/**
 * An array of available themes for the application.
 */
export const themes: Theme[] = [
  {
    name: 'SoloScribe',
    colors: ['#050510', 'rgba(10, 10, 25, 0.8)', '#00f3ff', '#e0eaff', 'rgba(15, 15, 35, 0.9)'],
  }
];
