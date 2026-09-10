/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
      colors: {
        navy: { 950: '#020617', 900: '#0f172a', 800: '#1e293b' },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.35)',
        'glow-blue': '0 0 24px rgba(59,130,246,0.2)',
        'glow-emerald': '0 0 24px rgba(16,185,129,0.15)',
      },
      backgroundImage: {
        'grid-slate': 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
      },
      backgroundSize: { 'grid': '40px 40px' },
      animation: {
        'in': 'fadeUp 0.22s ease-out both',
        'fade': 'fadeIn 0.18s ease-out both',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'modal-in': 'modalIn 0.22s cubic-bezier(0.16,1,0.3,1) both',
        'backdrop-in': 'backdropIn 0.22s ease-out both',
        'toast-in': 'toastIn 0.32s cubic-bezier(0.16,1,0.3,1) both',
        'toast-out': 'toastOut 0.2s ease-in both',
        'drawer-in': 'drawerIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s linear infinite',
        'pop': 'pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'check-pop': 'checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      },
      keyframes: {
        fadeUp: { from:{ opacity:'0', transform:'translateY(6px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        fadeIn: { from:{ opacity:'0' }, to:{ opacity:'1' } },
        modalIn: { from:{ opacity:'0', transform:'translateY(12px) scale(0.96)' }, to:{ opacity:'1', transform:'translateY(0) scale(1)' } },
        backdropIn: { from:{ opacity:'0' }, to:{ opacity:'1' } },
        toastIn: { from:{ opacity:'0', transform:'translateY(16px) scale(0.95)' }, to:{ opacity:'1', transform:'translateY(0) scale(1)' } },
        toastOut: { from:{ opacity:'1', transform:'translateY(0) scale(1)' }, to:{ opacity:'0', transform:'translateY(8px) scale(0.96)' } },
        drawerIn: { from:{ opacity:'0', transform:'translateX(24px)' }, to:{ opacity:'1', transform:'translateX(0)' } },
        scaleIn: { from:{ opacity:'0', transform:'scale(0.92)' }, to:{ opacity:'1', transform:'scale(1)' } },
        float: { '0%,100%':{ transform:'translateY(0) translateX(0)' }, '50%':{ transform:'translateY(-14px) translateX(8px)' } },
        shimmer: { from:{ backgroundPosition:'-200% 0' }, to:{ backgroundPosition:'200% 0' } },
        pop: { '0%':{ opacity:'0', transform:'scale(0.85)' }, '60%':{ opacity:'1', transform:'scale(1.04)' }, '100%':{ transform:'scale(1)' } },
        checkPop: { '0%':{ transform:'scale(0) rotate(-20deg)', opacity:'0' }, '60%':{ transform:'scale(1.2) rotate(8deg)', opacity:'1' }, '100%':{ transform:'scale(1) rotate(0)' } },
      },
    },
  },
  plugins: [],
}
