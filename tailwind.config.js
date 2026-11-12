/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'surface-container-lowest': 'var(--color-surface-lowest)',
        'surface-container-low': 'var(--color-surface-low)',
        'surface-container': 'var(--color-surface)',
        'surface-container-high': 'var(--color-surface-2)',
        'surface-container-highest': 'var(--color-surface-highest)',
        border: 'var(--color-border)',
        'on-surface': 'var(--color-text)',
        'on-surface-variant': 'var(--color-text-muted)',
        outline: 'var(--color-text-muted)',
        'outline-variant': 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary': 'var(--color-on-primary)',
        income: 'var(--color-income)',
        tertiary: 'var(--color-income)',
        'tertiary-container': 'rgba(45, 212, 167, 0.2)',
        expense: 'var(--color-expense)',
        error: 'var(--color-expense)',
        'error-container': 'rgba(248, 113, 113, 0.2)',
        'on-error-container': 'var(--color-expense)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        secondary: '#bbc6e8',
        'secondary-container': '#3e4965',
        'secondary-fixed': '#d9e2ff',
        'secondary-fixed-dim': '#bbc6e8',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        card: '16px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        glow: '0 8px 24px -4px rgba(45, 212, 167, 0.35)',
      }
    },
  },
  plugins: [],
}

