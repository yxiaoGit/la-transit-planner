import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0f14",
          900: "#121820",
          800: "#1a2330",
          700: "#243041",
        },
        signal: {
          DEFAULT: "#f5a524",
          dim: "#c4841c",
          soft: "#ffe3a8",
        },
        route: {
          teal: "#2aa9a1",
          red: "#e23d28",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
