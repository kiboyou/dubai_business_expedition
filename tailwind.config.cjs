module.exports = {
  content: ["./index.html", "./**/*.{ts,tsx,js,jsx}"] ,
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#FFA07A',
          500: '#FF8A4B',
          600: '#FF6B35',
          900: '#1F2937'
        },
        'gold-accent': '#D4AF37',
        'gold-dark': '#b8860b',
        'gold-light': '#ffe38a',
        'carbon-black': '#07070a',
        'carbon-light': '#0f1720',
        'carbon-gray': '#111827',
        'glass-white': 'rgba(255,255,255,0.06)',
        'white': '#FFFFFF'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}
