/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fira Code', 'monospace'], 
      },
      colors: {
        background: '#0e1a2b', // Dark navy for the main background
        primary: '#2a5cbf',    // Bold blue for primary elements
        accent: '#4fa4e5',     // Light blue/cyan for accents and highlights
        textWhite: '#FFFFFF',  // White for text to ensure readability
              },
    },
  },
  plugins: [],
}

