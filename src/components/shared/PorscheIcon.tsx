/**
 * PorscheIcon Component
 * Renders Porsche Design System icons from CDN
 * Uses inline SVG for better performance and styling control
 */

import { useEffect, useState } from 'react';
import { getPorscheIcon } from '../../utils/porsche-assets';
import { ICONS_MANIFEST } from '@porsche-design-system/assets';

// Module-level cache shared by every icon instance. Without this, each
// <PorscheIcon> refetches the same SVG from the CDN on every mount — the Teams
// page alone re-requested the same icons 5-6x. We cache resolved SVG markup by
// URL and dedupe concurrent in-flight requests so each icon loads exactly once.
const svgCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();

function loadPorscheIcon(url: string): Promise<string> {
  const cached = svgCache.get(url);
  if (cached !== undefined) return Promise.resolve(cached);

  let request = inFlight.get(url);
  if (!request) {
    request = fetch(url)
      .then((response) => response.text())
      .then((svg) => {
        // Remove XML declaration and clean up SVG
        const clean = svg.replace(/<\?xml[^>]*\?>/g, '').trim();
        svgCache.set(url, clean);
        inFlight.delete(url);
        return clean;
      })
      .catch((error) => {
        inFlight.delete(url);
        throw error;
      });
    inFlight.set(url, request);
  }
  return request;
}

interface PorscheIconProps {
  /** Name of the Porsche icon */
  name: keyof typeof ICONS_MANIFEST;
  /** Size in pixels or Tailwind class */
  size?: number | string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export const PorscheIcon: React.FC<PorscheIconProps> = ({
  name,
  size = 24,
  className = '',
  ariaLabel,
}) => {
  const iconUrl = getPorscheIcon(name);
  // Seed from cache so already-loaded icons render immediately (no flash).
  const [svgContent, setSvgContent] = useState<string>(() => svgCache.get(iconUrl) ?? '');

  useEffect(() => {
    let isMounted = true;

    loadPorscheIcon(iconUrl)
      .then((svg) => {
        if (isMounted) setSvgContent(svg);
      })
      .catch((error) => {
        if (isMounted) {
          console.error(`Failed to load Porsche icon "${String(name)}":`, error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [iconUrl, name]);

  const sizeStyle = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      className={`inline-flex items-center justify-center porsche-icon ${className}`}
      style={{ width: sizeStyle, height: sizeStyle }}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
