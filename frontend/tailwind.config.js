/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090909',
        surface: {
          DEFAULT: '#141414',
          subtle: '#111111',
          card: '#1B1B1B',
          cardHover: '#232323',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.16)',
          strong: 'rgba(255, 255, 255, 0.25)',
        },
        accent: {
          red: '#E53945',
          redHover: '#FF4D5A',
          redMuted: 'rgba(229, 57, 69, 0.15)',
          redGlow: 'rgba(229, 57, 69, 0.35)',
        },
        status: {
          success: '#35C98B',
          successMuted: 'rgba(53, 201, 139, 0.15)',
          warning: '#E5A83B',
          warningMuted: 'rgba(229, 168, 59, 0.15)',
          danger: '#EF4444',
          dangerMuted: 'rgba(239, 68, 68, 0.15)',
        },
        primary: {
          DEFAULT: '#FFFFFF',
          secondary: '#A1A1AA',
          muted: '#71717A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-red': '0 0 25px -5px rgba(229, 57, 69, 0.35)',
        'glow-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.37), 0 1px 2px -1px rgba(0, 0, 0, 0.37)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        }
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
        pulseSlow: 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
