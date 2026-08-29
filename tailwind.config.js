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
        background: '#090a0f',
        surface: 'rgba(18, 20, 29, 0.75)',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
        neon: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#b000ff',
          pink: '#ff007f',
          green: '#00ff88',
          amber: '#ffb703',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 1.8s ease-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(0, 242, 254, 0.8))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 5px rgba(0, 242, 254, 0.4))' },
        },
        'ripple': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 242, 254, 0.35)',
        'neon-purple': '0 0 20px rgba(176, 0, 255, 0.35)',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
