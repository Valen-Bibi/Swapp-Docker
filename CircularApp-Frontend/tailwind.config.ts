import type { Config } from "tailwindcss";

const config: Config = {
  // 👇 AQUÍ ESTÁ EL CAMBIO IMPORTANTE
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Si usas carpeta src
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Si NO usas carpeta src
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        swapp: {
          black: '#000000',
          dark: '#10131B',
          navy: '#172638',
          blue: '#132D46',
          teal: '#0A786A',
          mint: '#01C38E',
          light: '#80E1C7',
          white: '#FFFFFF',
        }
      },
    },
  },
  plugins: [],
};
export default config;