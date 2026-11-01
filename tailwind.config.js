/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html", "!./node_modules/**", "./translations.js", "./scripts/**/*.js", "./templates/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Design-system tokens. copper / copper-light are the brown-grey accent of the original site (#6d5b47). */
        "paper": "#fbf9f5","sand": "#f0ece6","sand-deep": "#e7ded1","chip": "#f1ece5","line": "#e6e0d6","card": "#ffffff",
        "forest": "#17302b","forest-dark": "#0f231f","ink": "#1c2420","body": "#4a4740","muted": "#6f6a60",
        "copper": "#6d5b47","copper-light": "#c6af97","field": "#8e867a","danger": "#b3261e"
      },
      boxShadow: { "soft": "0 10px 32px -4px rgba(28, 36, 32, 0.06)" },
      fontFamily: { "headline": ["Newsreader", "Newsreader Fallback", "serif"], "body": ["Manrope", "Manrope Fallback", "sans-serif"], "label": ["Manrope", "Manrope Fallback", "sans-serif"], "signature": ["Signature", "cursive"] },
      borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem", "card": "6px", "btn": "4px", "pill": "9999px"},
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
