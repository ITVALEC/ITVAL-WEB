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
        navy: "#1A2E44",
        grey: {
          /** Oscurecido para cumplir contraste WCAG AA (>=4.5:1 sobre blanco). */
          DEFAULT: "#6C7075",
          dark: "#565A5E",
          /** Gris claro original: solo para bordes/detalles decorativos. */
          light: "#A6A9AB",
        },
        cornflower: {
          /** Acento de marca: usar sobre fondos oscuros (navy). */
          DEFAULT: "#6495ED",
          /** Variante oscura accesible (AA sobre blanco) para texto/enlaces en fondos claros. */
          ink: "#2F62C8",
        },
        action: "#0069D9",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
