/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  withOpacity('--primary-50'),
          100: withOpacity('--primary-100'),
          200: withOpacity('--primary-200'),
          300: withOpacity('--primary-300'),
          400: withOpacity('--primary-400'),
          500: withOpacity('--primary-500'),
          600: withOpacity('--primary-600'),
          700: withOpacity('--primary-700'),
          800: withOpacity('--primary-800'),
          900: withOpacity('--primary-900'),
        },
        surface: {
          900: withOpacity('--surface-900'),
          800: withOpacity('--surface-800'),
          700: withOpacity('--surface-700'),
          600: withOpacity('--surface-600'),
          500: withOpacity('--surface-500'),
        },
        slate: {
          50:  withOpacity('--slate-50'),
          100: withOpacity('--slate-100'),
          200: withOpacity('--slate-200'),
          300: withOpacity('--slate-300'),
          400: withOpacity('--slate-400'),
          500: withOpacity('--slate-500'),
          600: withOpacity('--slate-600'),
          700: withOpacity('--slate-700'),
          800: withOpacity('--slate-800'),
          900: withOpacity('--slate-900'),
        },
        white: withOpacity('--white-color'),
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
