/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Direct named palette colors from reference
        burgundy: {
          DEFAULT: '#800020',
          vintage: '#9B1D30',
          wine: '#B0303C',
          oxblood: '#5E0F1A',
          dark: '#3B0A12',
        },
        cream: {
          DEFAULT: '#FFF5E1',
          ivory: '#F7ECD4',
          soft: '#EFE2C6',
          warm: '#E6D7B9',
          dark: '#DCC8A3',
        },
        primary: {
          DEFAULT: '#800020',       // BURGUNDY
          dark: '#5E0F1A',          // OXBLOOD
          light: '#9B1D30',         // VINTAGE BURGUNDY
          wine: '#B0303C',          // WINE RED
          deep: '#3B0A12',          // DARK BURGUNDY
          subtle: '#FFF5E1',        // CREAM
        },
        accent: {
          DEFAULT: '#9B1D30',       // VINTAGE BURGUNDY
          hover: '#800020',         // BURGUNDY
          light: '#F7ECD4',         // IVORY CREAM
          soft: '#EFE2C6',          // SOFT CREAM
          warm: '#E6D7B9',          // WARM CREAM
          dark: '#DCC8A3',          // DARK CREAM
        },
        danger: {
          DEFAULT: '#B0303C',       // WINE RED
          dark: '#5E0F1A',          // OXBLOOD
          light: '#FFF5E1',         // CREAM
        },
        warning: {
          DEFAULT: '#C97A24',
          light: '#FFF5E1',
        },
        success: {
          DEFAULT: '#2F8F5B',
          dark: '#247047',
          light: '#EAF6EF',
        },
        info: {
          DEFAULT: '#5E0F1A',       // OXBLOOD
          light: '#F7ECD4',         // IVORY CREAM
        },
        shelter: {
          DEFAULT: '#800020',       // BURGUNDY
          light: '#F7ECD4',         // IVORY CREAM
        },
        surface: '#FFFFFF',
        background: '#FAF6F0',      // Warm luminous cream canvas
        border: '#E6D7B9',          // WARM CREAM
        'border-soft': '#EFE2C6',   // SOFT CREAM
        'border-dark': '#DCC8A3',   // DARK CREAM
        text: {
          DEFAULT: '#3B0A12',       // DARK BURGUNDY
          muted: '#6F4E53',         // Muted warm burgundy
          light: '#997D81',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
