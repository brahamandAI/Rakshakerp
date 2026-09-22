import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        premium: "#071526",
        primary: {
          DEFAULT: "#0B1F3A",
          hover: "#12325C",
        },
        accent: {
          DEFAULT: "#D4AF37",
          muted: "#E8D5A3",
        },
        brand: {
          sky: "#0EA5E9",
          teal: "#0F766E",
          mist: "#F4F7FB",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "var(--font-jakarta)", "system-ui", "sans-serif"],
        heading: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 50px -24px rgba(14,165,233,0.45)",
        soft: "0 10px 40px -20px rgba(11,31,58,0.35)",
      },
    },
  },
  plugins: [],
};
export default config;


