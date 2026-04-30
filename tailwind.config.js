/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik", "sans-serif"],
        poppins: ['"Poppins"', "sans-serif"],
        open_sans: ['"Open Sans"', "sans-serif"],
        system: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
        ],
        keyframes: {
          "fade-in": {
            "0%": { opacity: 0, transform: "scale(0.95)" },
            "100%": { opacity: 1, transform: "scale(1)" },
          },
        },
        animation: { "fade-in": "fade-in 0.2s ease-out" },
      },
    },
  },
  plugins: [],
};
