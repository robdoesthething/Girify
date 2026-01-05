/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
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
