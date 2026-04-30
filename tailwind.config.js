/** @type {import('tailwindcss').Config} */
const withAlpha = (varName) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `rgb(var(${varName}))`
    : `rgb(var(${varName}) / ${opacityValue})`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        // sans/poppins/open_sans permanecem para não quebrar componentes existentes
        sans: ["Rubik", "sans-serif"],
        poppins: ['"Poppins"', "sans-serif"],
        open_sans: ['"Open Sans"', "sans-serif"],
        // fonte do sistema operacional
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
      },
      colors: {
        brand: {
          50:  withAlpha("--brand-50"),
          100: withAlpha("--brand-100"),
          200: withAlpha("--brand-200"),
          300: withAlpha("--brand-300"),
          400: withAlpha("--brand-400"),
          500: withAlpha("--brand-500"),
          600: withAlpha("--brand-600"),
          700: withAlpha("--brand-700"),
          800: withAlpha("--brand-800"),
          900: withAlpha("--brand-900"),
          DEFAULT: withAlpha("--brand-600"),
        },
        accent: {
          400: withAlpha("--accent-400"),
          500: withAlpha("--accent-500"),
          600: withAlpha("--accent-600"),
          DEFAULT: withAlpha("--accent-500"),
        },
        ink: {
          DEFAULT: withAlpha("--ink"),
          muted: withAlpha("--ink-muted"),
          subtle: withAlpha("--ink-subtle"),
        },
        surface: {
          DEFAULT: withAlpha("--surface"),
          1: withAlpha("--surface-1"),
          2: withAlpha("--surface-2"),
        },
        hairline: withAlpha("--hairline"),
        success: withAlpha("--success"),
        warning: withAlpha("--warning"),
        danger:  withAlpha("--danger"),
        info:    withAlpha("--info"),
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        soft: "var(--shadow-sm)",
        "soft-md": "var(--shadow-md)",
        "soft-lg": "var(--shadow-lg)",
        "soft-xl": "var(--shadow-xl)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in":    { "0%": { opacity: 0, transform: "scale(0.97)" }, "100%": { opacity: 1, transform: "scale(1)" } },
        "fade-in-up": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%":      { transform: "rotate(3deg)" },
        },
      },
      animation: {
        "fade-in":    "fade-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in-up": "fade-in-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        wiggle:       "wiggle 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
