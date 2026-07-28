import type { Config } from "tailwindcss";

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
          DEFAULT: "#0B1C2C",
          mid: "#1A2E44",
          soft: "#243B53",
        },
        gold: {
          DEFAULT: "#C9A227",
          soft: "#D4B84A",
          deep: "#A8871E",
          muted: "rgba(201, 162, 39, 0.15)",
        },
        surface: {
          DEFAULT: "#F7F5F0",
          raised: "#FFFFFF",
          muted: "#EDE9E1",
        },
        grey: {
          /** Oscurecido para cumplir contraste WCAG AA (>=4.5:1 sobre blanco). */
          DEFAULT: "#6C7075",
          dark: "#565A5E",
          /** Gris claro original: solo para bordes/detalles decorativos. */
          light: "#A6A9AB",
        },
        cornflower: {
          /** Acento legado: preferir gold en superficies públicas. */
          DEFAULT: "#6495ED",
          /** Variante oscura accesible (AA sobre blanco) para texto/enlaces en fondos claros. */
          ink: "#2F62C8",
        },
        /** Alias de CTA primario (oro). */
        action: "#C9A227",
      },
      fontFamily: {
        sans: [
          "var(--font-outfit)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 8px 28px rgba(201, 162, 39, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
