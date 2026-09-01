import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Enhanced color palette with design system tokens
      colors: {
        ink: "#101827",
        mist: "#f4efe8",
        coral: "#f97316",
        aqua: "#14b8a6",
        slate: "#334155",
      },
      // Typography system
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px", letterSpacing: "0.022em" }],
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontWeight: {
        350: "350",
        450: "450",
        550: "550",
        650: "650",
      },
      // Enhanced spacing system
      spacing: {
        "3.5": "0.875rem",
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "6.5": "1.625rem",
        "7.5": "1.875rem",
      },
      // Premium shadow system
      boxShadow: {
        // Subtle shadows for depth
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        base: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        md: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        lg: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        glow: "0 24px 80px rgba(20, 184, 166, 0.18)",
        // Hover/elevated states
        hover: "0 8px 12px -2px rgba(0, 0, 0, 0.1)",
        active: "0 12px 20px -3px rgba(0, 0, 0, 0.12)",
      },
      // Border radius system
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      // Animation system
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-up": "fade-up 300ms ease-out",
        "scale-in": "scale-in 200ms ease-out",
        "slide-in-left": "slide-in-left 250ms ease-out",
      },
      // Backdrop blur
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
