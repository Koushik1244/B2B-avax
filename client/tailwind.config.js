/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        biz: {
          navy:        '#0c1222',
          slate:       '#1e293b',
          surface:     '#f0f4ff',   // ← was 'biz-surface' (duplicate removed)
          surfaceDark: '#0f172a',   // ← was 'biz-navy' (duplicate removed)
          border:      '#e2e8f0',
          borderDark:  '#334155',
          accent:      '#2563eb',
          accentSoft:  '#dbeafe',
          accentHover: '#1d4ed8',
          muted:       '#64748b',
          glow:        '#22d3ee',
        },
      },
      boxShadow: {
        'biz': '0 4px 24px -4px rgba(15, 23, 42, 0.12), 0 8px 32px -8px rgba(37, 99, 235, 0.08)',
        'biz-dark': '0 4px 32px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(34, 211, 238, 0.06)',
      },
      animation: {
        'float-slow': 'float3d 7s ease-in-out infinite',
        'float-mid': 'float3d 5.5s ease-in-out infinite',
        'float-fast': 'float3d 4s ease-in-out infinite',
        'pop-alert': 'popAlert 2.8s ease-in-out infinite',
        'pop-alert-2': 'popAlert 2.8s ease-in-out infinite 0.4s',
        'pop-alert-3': 'popAlert 2.8s ease-in-out infinite 0.8s',
        'flow-merge': 'flowMerge 4s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        orbit: 'orbit 20s linear infinite',
      },
      keyframes: {
        float3d: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotateX(8deg) rotateY(-6deg)' },
          '33%': { transform: 'translate3d(8px, -16px, 12px) rotateX(4deg) rotateY(4deg)' },
          '66%': { transform: 'translate3d(-10px, 8px, -8px) rotateX(12deg) rotateY(-10deg)' },
        },
        popAlert: {
          '0%, 100%': { transform: 'scale(0.92) translateY(6px)', opacity: '0.35' },
          '15%': { transform: 'scale(1.08) translateY(0)', opacity: '1' },
          '30%': { transform: 'scale(1) translateY(-4px)', opacity: '0.9' },
          '50%': { transform: 'scale(0.95) translateY(8px)', opacity: '0.4' },
        },
        flowMerge: {
          '0%': { transform: 'translate(40px, 20px) scale(0.85)', opacity: '0.5' },
          '40%, 60%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(-30px, -15px) scale(0.9)', opacity: '0.65' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.35), 0 0 60px rgba(139, 92, 246, 0.15)' },
          '50%': { boxShadow: '0 0 35px rgba(6, 182, 212, 0.55), 0 0 90px rgba(139, 92, 246, 0.25)' },
        },
        orbit: {
          from: { transform: 'rotate(0deg) translateX(140px) rotate(0deg)' },
          to: { transform: 'rotate(360deg) translateX(140px) rotate(-360deg)' },
        },
      },
    },
  },
  plugins: [],
};
