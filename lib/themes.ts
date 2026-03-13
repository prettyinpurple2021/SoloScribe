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
    colors: ['rgba(0, 0, 0, 0.25)', 'rgba(15, 23, 42, 0.6)', '#2dd4bf', '#f8fafc', 'rgba(0, 0, 0, 0.4)'],
  }
];
