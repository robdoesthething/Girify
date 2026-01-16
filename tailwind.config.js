/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Enhanced color palette
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          cyan: '#06b6d4',
          yellow: '#fbbf24',
          emerald: '#10b981',
        },
        // Navy blue for your current dark blue buttons
        navy: {
          DEFAULT: '#000080',
          dark: '#000060',
          light: '#0000a0',
        },
      },
      // Typography scale
      fontSize: {
        display: ['3rem', { lineHeight: '1.1', fontWeight: '900', letterSpacing: '-0.02em' }],
        'heading-xl': [
          '2.5rem',
          { lineHeight: '1.2', fontWeight: '800', letterSpacing: '-0.01em' },
        ],
        'heading-lg': ['2rem', { lineHeight: '1.3', fontWeight: '700' }],
        'heading-md': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      // Spacing scale
      spacing: {
        18: '4.5rem',
        112: '28rem',
        128: '32rem',
      },
      // Animation timings
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        blob: 'blob 7s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(14, 165, 233, 0.6)',
            transform: 'scale(1.02)',
          },
        },
      },
      // Box shadows
      boxShadow: {
        'glow-sm': '0 0 10px rgba(14, 165, 233, 0.3)',
        glow: '0 0 20px rgba(14, 165, 233, 0.5)',
        'glow-lg': '0 0 30px rgba(14, 165, 233, 0.7)',
        'inner-glow': 'inset 0 0 20px rgba(14, 165, 233, 0.2)',
      },
      // Border radius
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  safelist: [
    // Frame colors from cosmetics.json
    'ring-yellow-500',
    'ring-slate-400',
    'ring-orange-700',
    'ring-cyan-400',
    'shadow-yellow-500/50',
    'shadow-slate-400/50',
    'shadow-orange-700/50',
    'shadow-cyan-400/50',
  ],
  plugins: [],
};
