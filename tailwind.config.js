/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0f0f0f',
        surface: '#1a1a1a',
        divider: '#2a2a2a',
        copy: '#f0f0f0',
        muted: '#888888',
        brand: {
          blue: '#1a56b0',
          teal: '#5bc4b8',
          lime: '#c8e87a',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        accent: 'linear-gradient(135deg, #1a56b0, #5bc4b8, #c8e87a)',
        'accent-soft': 'radial-gradient(circle at top left, rgba(26, 86, 176, 0.26), transparent 38%), radial-gradient(circle at bottom right, rgba(200, 232, 122, 0.18), transparent 28%)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(91, 196, 184, 0.35), 0 14px 48px rgba(26, 86, 176, 0.18)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 6s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
