/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ntu-red': 'var(--ntu-red)',
        'ntu-blue': 'var(--ntu-blue)',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        extend: {
          animation: {
            'gradient-x': 'gradient-x 3s ease infinite',
          },
        },
        techDark: {
          ...require("daisyui/src/theming/themes")["[data-theme=cyberpunk]"],
          "primary": "#00ff9f",
          "secondary": "#ff00a0",
          "accent": "#0080ff",
          "neutral": "#1a1a2e",
          "base-100": "#0f0f1a",
          "base-200": "#16213e",
          "base-300": "#1e2a4a",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
};
