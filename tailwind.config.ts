import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101827",
        mist: "#f4efe8",
        coral: "#f97316",
        aqua: "#14b8a6",
        slate: "#334155",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(20, 184, 166, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
