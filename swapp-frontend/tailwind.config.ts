import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        swapp: {
          'negro': '#000000',
          'negro-azulado': '#10131B',
          'azul-petroleo': '#172638',
          'azul-oceano': '#132D46',
          'turquesa-oscuro': '#0A786A',
          'verde-agua': '#01C38E',
          'menta': '#80E1C7',
          'tiza': '#EDEAE5',
          'blanco': '#FFFFFF',
        }
      },
    },
  },
  plugins: [],
};
export default config;