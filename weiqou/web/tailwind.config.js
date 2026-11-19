/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Solarda tokens. Verdict colours carry meaning: allow / modify / veto / needs human. Use them only for that.
        leaf: { 950: '#0C261C', 900: '#12352A', 800: '#184634', 700: '#1F5A3F', 600: '#2F7D4F', 200: '#C5DDCB', 100: '#E3EFE6', 50: '#F1F6F2' },
        paper: '#F7F8F4',
        ink: '#18211B',
        sprout: '#A3C94B',
        allow: '#2F7D4F',
        modify: '#8F5E06',
        veto: '#B3401F',
        human: '#3B4FB0',
        agri: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 900: '#14532d' },
        solarda: { 500: '#0284c7', 600: '#0369a1', 700: '#075985' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
