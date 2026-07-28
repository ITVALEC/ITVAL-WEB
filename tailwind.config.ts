import type { Config } from "tailwindcss";

/** ITVAL Design System Master Guide v1 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F2747",
          dark: "#091A30",
          mid: "#1A3A5C",
          soft: "#243B53",
        },
        gold: {
          DEFAULT: "#C89A4B",
          soft: "#D4B06A",
          deep: "#A67F3A",
          muted: "rgba(200, 154, 75, 0.15)",
        },
        surface: {
          DEFAULT: "#F5F7FA",
          raised: "#FFFFFF",
          muted: "#E8ECF1",
        },
        ink: "#1F2937",
        grey: {
          DEFAULT: "#6B7280",
          dark: "#1F2937",
          light: "#9CA3AF",
        },
        success: "#2E7D32",
        error: "#C62828",
        cornflower: {
          DEFAULT: "#6495ED",
          ink: "#2F62C8",
        },
        action: "#C89A4B",
      },
      fontFamily: {
        sans: [
          "var(--font-manrope)",
          "var(--font-plus-jakarta)",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-manrope)",
          "var(--font-plus-jakarta)",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "ds-h1": ["4rem", { lineHeight: "4.5rem", fontWeight: "700" }],
        "ds-h2": ["3rem", { lineHeight: "1.5", fontWeight: "700" }],
        "ds-h3": ["2rem", { lineHeight: "1.5", fontWeight: "700" }],
        "ds-body": ["1.125rem", { lineHeight: "1.5", fontWeight: "400" }],
        "ds-caption": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
      },
      maxWidth: {
        container: "1440px",
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 8px 30px rgba(9, 26, 48, 0.08)",
        "card-hover": "0 16px 40px rgba(9, 26, 48, 0.14)",
        gold: "0 8px 28px rgba(200, 154, 75, 0.28)",
      },
      transitionDuration: {
        ds: "250ms",
      },
      spacing: {
        section: "6rem",
        "card-gap": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
