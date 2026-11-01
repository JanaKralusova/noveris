/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html", "!./node_modules/**", "./translations.js", "./scripts/**/*.js", "./templates/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container-high": "#ebe8e1","on-secondary": "#ffffff","error-container": "#ffdad6",
        "surface-container-highest": "#e5e2db","secondary-fixed": "#ffe088","background": "#fcf9f2",
        "surface-variant": "#e5e2db","secondary-container": "#fed65b","tertiary-fixed-dim": "#d8c3b2",
        "surface-container-low": "#f6f3ec","primary-fixed": "#f7dec4","tertiary-fixed": "#f5decd",
        "tertiary-container": "#c4af9f","on-surface": "#1c1c18","surface-tint": "#6d5b47",
        "inverse-primary": "#dac3aa","on-background": "#1c1c18","on-tertiary-fixed": "#25190f",
        "on-primary-fixed": "#261909","error": "#ba1a1a","surface-container-lowest": "#ffffff",
        "on-primary": "#ffffff","surface": "#fcf9f2","on-primary-container": "#52422f",
        "on-tertiary-container": "#514235","outline": "#6b624f","on-secondary-fixed": "#241a00",
        "tertiary": "#6c5b4d","primary": "#6d5b47","inverse-surface": "#31312c",
        "on-tertiary": "#ffffff","surface-container": "#f0eee7","secondary": "#735c00",
        "surface-dim": "#dcdad3","on-error-container": "#93000a","on-primary-fixed-variant": "#544431",
        "inverse-on-surface": "#f3f0ea","primary-container": "#c6af97","outline-variant": "#d0c5af",
        "primary-fixed-dim": "#dac3aa","on-secondary-fixed-variant": "#574500","on-tertiary-fixed-variant": "#534437",
        "on-error": "#ffffff","secondary-fixed-dim": "#e9c349","on-surface-variant": "#4d4635",
        "on-secondary-container": "#745c00","surface-bright": "#fcf9f2",
        /* Redesign tokens (design-system/) - additive */
        "paper": "#fbf9f5","sand": "#f0ece6","sand-deep": "#e7ded1","chip": "#f1ece5","line": "#e6e0d6","card": "#ffffff",
        "forest": "#17302b","forest-dark": "#0f231f","ink": "#1c2420","body": "#4a4740","muted": "#6f6a60",
        "copper": "#8f5535","copper-light": "#e0b08a","field": "#8e867a","danger": "#b3261e"
      },
      boxShadow: { "soft": "0 10px 32px -4px rgba(28, 36, 32, 0.06)" },
      fontFamily: { "headline": ["Newsreader", "Newsreader Fallback", "serif"], "body": ["Manrope", "Manrope Fallback", "sans-serif"], "label": ["Manrope", "Manrope Fallback", "sans-serif"] },
      borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem", "card": "6px", "btn": "4px", "pill": "9999px"},
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
