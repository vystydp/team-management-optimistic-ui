/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      colors: {
        // Console Theme (Porsche-derived, instrument panel aesthetic)
        console: {
          primary: '#223971',      // Deep navy - primary UI accent
          'primary-soft': '#2d4a8a',  // Lighter navy for hovers
          'primary-dark': '#1a2b57',  // Darker navy for pressed states
        },
        porsche: {
          red: '#D5001C',         // Reserved for errors, alerts, destructive actions only
          'red-light': '#E84C3D',  // Lighter red for hover states
          'red-dark': '#A8000E',   // Darker red for pressed states
          black: '#1F2937',        // Console text - darker, more tool-like
          canvas: '#F5F6F7',       // Cooler, technical background
          surface: '#FFFFFF',      // White surface
          shading: 'rgba(0, 0, 0, 0.06)',  // Stronger for module feel
          frosted: 'rgba(255, 255, 255, 0.95)',  // More opaque
          silver: '#D1D5DB',       // Stronger borders for equipment modules
          'silver-light': '#E5E7EB',
          'silver-dark': '#9CA3AF',
          'neutral-50': '#F9FAFB',
          'neutral-100': '#F3F4F6',
          'neutral-200': '#E5E7EB',
          'neutral-300': '#D1D5DB',
          'neutral-400': '#9CA3AF',
          'neutral-500': '#6B7280',  // contrast-medium
          'neutral-600': '#4B5563',
          'neutral-700': '#374151',  // For "always-on" states
          'neutral-800': '#1F2937',
          'neutral-900': '#111827',
          success: '#10B981',
          'success-bg': 'rgba(16, 185, 129, 0.05)',  // 5% tint - console aesthetic
          warning: '#F59E0B',
          'warning-bg': 'rgba(245, 158, 11, 0.08)',  // 8% tint
          error: '#D5001C',
          'error-bg': 'rgba(213, 0, 28, 0.05)',  // 5% tint
        },
        optimistic: {
          success: '#10b981',
          pending: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Porsche Next W La', 'Porsche Next', 'system-ui', '-apple-system', 'sans-serif'],
        porsche: ['Porsche Next W La', 'Porsche Next', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Porsche Typography Scale
        'display-lg': ['clamp(3.75rem, 7.81vw, 7.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['clamp(2.75rem, 5.73vw, 5.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['clamp(2.25rem, 4.69vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '700' }],
        'heading-xxl': ['clamp(2rem, 4.17vw, 4rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-xl': ['clamp(1.75rem, 3.65vw, 3.5rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-lg': ['clamp(1.5rem, 3.13vw, 3rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-md': ['clamp(1.25rem, 2.6vw, 2.5rem)', { lineHeight: '1.3', fontWeight: '700' }],
        'heading-sm': ['clamp(1.125rem, 2.34vw, 2.25rem)', { lineHeight: '1.3', fontWeight: '700' }],
      },
      spacing: {
        // Fluid Spacing (Official Porsche Tokens)
        'fluid-xs': 'clamp(0.25rem, 0.52vw, 0.5rem)',
        'fluid-sm': 'clamp(0.5rem, 1.04vw, 1rem)',
        'fluid-md': 'clamp(1rem, 2.08vw, 2rem)',
        'fluid-lg': 'clamp(1.5rem, 3.13vw, 3rem)',
        'fluid-xl': 'clamp(2rem, 4.17vw, 4rem)',
        'fluid-xxl': 'clamp(2.5rem, 5.21vw, 5rem)',
      },
      borderRadius: {
        'porsche-sm': '0.25rem',    // 4px
        'porsche': '0.5rem',        // 8px (medium)
        'porsche-lg': '0.75rem',    // 12px (large)
        'porsche-xl': '1rem',       // 16px
      },
      boxShadow: {
        // Porsche Shadow System
        'porsche-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'porsche-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'porsche-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'porsche-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      transitionDuration: {
        // Porsche Motion Duration
        'short': '150ms',
        'moderate': '200ms',
        'long': '300ms',
      },
      transitionTimingFunction: {
        // Porsche Easing Functions
        'porsche-base': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'porsche-in': 'cubic-bezier(0.42, 0, 1, 1)',
        'porsche-out': 'cubic-bezier(0, 0, 0.58, 1)',
      },
      backdropBlur: {
        'porsche-sm': '8px',
        'porsche-md': '16px',
      },
    },
  },
  plugins: [],
}
