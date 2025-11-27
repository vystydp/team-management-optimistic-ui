/**
 * PorscheIcon Component
 * Renders Porsche Design System icons from CDN
 * Uses inline SVG for better performance and styling control
 */

import { useEffect, useState } from 'react';
import { getPorscheIcon } from '../../utils/porsche-assets';
import { ICONS_MANIFEST } from '@porsche-design-system/assets';

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
  const [svgContent, setSvgContent] = useState<string>('');
  const iconUrl = getPorscheIcon(name);

  useEffect(() => {
    let isMounted = true;

    // Fetch the SVG content from CDN
    fetch(iconUrl)
      .then((response) => response.text())
      .then((svg) => {
        if (isMounted) {
          // Remove XML declaration and clean up SVG
          const cleanSvg = svg.replace(/<\?xml[^>]*\?>/g, '').trim();
          setSvgContent(cleanSvg);
        }
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
