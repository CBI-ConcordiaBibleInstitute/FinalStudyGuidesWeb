/** @type {import('tailwindcss').Config} */
// Palette taken verbatim from concordiabible.org's theme stylesheet
// (wp-content/themes/cbi/css/style.min.css) so colors match exactly.
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Concordia maroon — exact brand reds from the cbi theme.
        maroon: {
          DEFAULT: "#660e1b",
          dark: "#430c0d",
          deep: "#2c0608",
          light: "#8a1a28",
          soft: "#d9bfc3",
        },
        // Concordia blue accent — used for links/buttons across the site.
        gold: {
          DEFAULT: "#00a8e6",
          light: "#5cc6f0",
          dark: "#0086b8",
        },
        // Plain white page background; "cream" alias kept so legacy classes
        // still resolve (some components reference it).
        cream: "#ffffff",
        // Bright near-black body text (was the washed-out concordiabible.org gray).
        ink: "#0f0f10",
        // Light gray sidebar / panel background used on concordiabible.org.
        panel: "#f5f5f5",
        rule: "#e5e5e5",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "'Roboto Slab'", "Georgia", "serif"],
        body: ["var(--font-body)", "Roboto", "Helvetica", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Soft, minimal shadows — concordiabible.org uses flat boxes mostly.
        card: "0 1px 0 rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04)",
        lift: "0 4px 14px rgba(0,0,0,0.08)",
        gold: "0 4px 12px rgba(0,168,230,0.18)",
        glow: "0 1px 0 rgba(0,0,0,0.04)",
      },
      keyframes: {
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-6px)" },
          "40%,80%": { transform: "translateX(6px)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        shimmer: "shimmer 1.6s infinite",
        "fade-in": "fade-in 0.5s ease both",
      },
    },
  },
  plugins: [],
};
