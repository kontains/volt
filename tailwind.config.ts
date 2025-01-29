import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#E1E7EC",
        gray: colors.slate,
      },
      backgroundColor: {
        dark: "#0B1120",
      },
      backgroundImage: {
        'dark-radial': 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
      },
      fontFamily: {
        sans: ['"Aeonik"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
};

export default config;
