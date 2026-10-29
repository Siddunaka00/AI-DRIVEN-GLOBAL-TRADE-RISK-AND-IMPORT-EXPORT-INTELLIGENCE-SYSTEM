import type { Config } from "tailwindcss";

// Design tokens — navy/blue dashboard system (light: pale-blue surfaces,
// white cards; dark: charcoal-navy). `copper` is kept as the token NAME for
// the primary accent so existing components/styles don't need rewriting;
// its value is now primary blue. Sidebar rail uses --c-rail (navy).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "var(--c-paper)",
        panel: "var(--c-panel)",
        line: "var(--c-line)",
        ink: "var(--c-ink)",
        muted: "var(--c-muted)",
        faint: "var(--c-faint)",
        rail: "var(--c-rail)",
        elevate: "var(--c-elevate)",
        // The accent is a CSS variable that changes per theme, so Tailwind
        // cannot compute alpha variants (copper/40) from it at build time.
        // Register the accent as a static palette instead: shade 500 = light
        // accent, shade 600 = dark-mode accent. Components use copper /
        // copper-deep / copper-soft tokens which map to these shades, and
        // globals.css overrides those same utilities in .dark via @layer —
        // see the [class~="..."] rules below.
        copper: {
          DEFAULT: "#246bfd",
          300: "#93b8fd",
          400: "#5b8def",
          500: "#246bfd",
          600: "#60a5fa",
          deep: "#1d57d0",
          soft: "rgba(36, 107, 253, 0.09)",
        },
        teal: "var(--c-teal)",
        ok: "var(--c-ok)",
        warn: "var(--c-warn)",
        bad: "var(--c-bad)",
      },
      fontFamily: {
        display: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Tailwind only allows lineHeight/letterSpacing/fontWeight in the
        // tuple options object; tabular numerals are applied via the .num
        // utility class in globals.css instead.
        data: ["13px", { lineHeight: "18px" }],
      },
      borderRadius: { card: "10px", field: "7px" },
      boxShadow: {
        lift: "0 1px 2px rgba(26,25,22,0.06), 0 8px 24px -12px rgba(26,25,22,0.18)",
        sheet: "0 -8px 40px -8px rgba(26,25,22,0.35)",
      },
      transitionDuration: { fast: "140ms", phys: "180ms" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      animation: {
        rise: "rise 180ms ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
