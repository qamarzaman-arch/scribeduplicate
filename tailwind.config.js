/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6D4C82',
          secondary: '#404040',
          accent: '#9B7CAD',
          light: '#F5F3F7',
        }
      }
    },
  },
  plugins: [],
}
