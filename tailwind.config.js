/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        app: v('bg'),
        sidebar: v('sidebar'),
        surface: v('surface'),
        elevated: v('elevated'),
        fg: v('fg'),
        muted: v('muted'),
        faint: v('faint'),
        accent: { DEFAULT: v('accent'), fg: v('accent-fg') },
        ok: v('ok'),
        warn: v('warn'),
        danger: v('danger'),
        line: 'rgb(var(--fg) / 0.08)',
        'line-strong': 'rgb(var(--fg) / 0.14)',
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        pop: '0 0 0 1px rgb(var(--fg) / 0.08), 0 16px 48px -8px rgb(0 0 0 / 0.45)',
        glow: '0 0 0 1px rgb(var(--accent) / 0.5), 0 8px 32px -6px rgb(var(--accent) / 0.55)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(.2,.7,.2,1) both',
        'pop-in': 'pop-in .14s ease-out both',
      },
    },
  },
  plugins: [],
};
