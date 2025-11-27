/**
 * Porsche Design System Assets
 * Icons, fonts, and marques from @porsche-design-system/assets
 */

import {
  ICONS_CDN_BASE_URL,
  ICONS_MANIFEST,
  MARQUES_CDN_BASE_URL,
  MARQUES_MANIFEST,
  FONTS_CDN_BASE_URL,
  FONTS_MANIFEST,
} from '@porsche-design-system/assets';

/**
 * Get a Porsche icon URL
 * @param iconName - Name of the icon (e.g., 'add', 'edit', 'delete')
 * @returns Full CDN URL to the icon SVG
 */
export function getPorscheIcon(iconName: keyof typeof ICONS_MANIFEST): string {
  return `${ICONS_CDN_BASE_URL}/${ICONS_MANIFEST[iconName]}`;
}

/**
 * Get the Porsche marque logo URL
 * @param size - 'small' or 'medium'
 * @param density - '1x', '2x', or '3x' for retina displays
 * @param format - 'png' or 'webp'
 * @returns Full CDN URL to the marque image
 */
export function getPorscheMarque(
  size: 'small' | 'medium' = 'medium',
  density: '1x' | '2x' | '3x' = '2x',
  format: 'png' | 'webp' = 'webp'
): string {
  return `${MARQUES_CDN_BASE_URL}/${MARQUES_MANIFEST.porscheMarque[size][density][format]}`;
}

/**
 * Get a Porsche font URL
 * @param fontName - Name of the font variant
 * @param format - 'woff' or 'woff2'
 * @returns Full CDN URL to the font file
 */
export function getPorscheFont(
  fontName: keyof typeof FONTS_MANIFEST,
  format: 'woff' | 'woff2' = 'woff2'
): string {
  return `${FONTS_CDN_BASE_URL}/${FONTS_MANIFEST[fontName][format]}`;
}

// Export manifests for direct access if needed
export { ICONS_MANIFEST, MARQUES_MANIFEST, FONTS_MANIFEST };

// Export CDN base URLs
export { ICONS_CDN_BASE_URL, MARQUES_CDN_BASE_URL, FONTS_CDN_BASE_URL };
