import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#14161F",
        surface: "#1C2030",
        surface2: "#262B3D",
        text: "#F0EEE6",
        textdim: "#9BA0B4",
        amber: "#FFB454",
        amberdim: "#8A6A3A",
        mint: "#7EE8C0",
        border: "#34394D",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
