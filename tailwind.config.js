/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#fcfaf4',
        foreground: '#0a140f',
        card: '#ffffff',
        primary: '#103c28',
        'primary-foreground': '#fcfaf4',
        accent: '#d5e43f',
        'accent-foreground': '#002112',
        secondary: '#f0efe7',
        'secondary-foreground': '#14261d',
        muted: '#efefe9',
        'muted-foreground': '#5c675d',
        destructive: '#de3b3d',
        border: '#dfded7',
        input: '#e6e5dd',
        ring: '#103c28',
      },
      borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 22,
        '2xl': 30,
      },
      fontFamily: {
        sans: ['Geist', 'System'],
        display: ['Manrope', 'Geist', 'System'],
      },
    },
  },
  plugins: [],
};
