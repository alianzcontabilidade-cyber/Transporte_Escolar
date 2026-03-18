/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EBF4FF',
          100: '#D6E8FF',
          200: '#A8CCEE',
          300: '#7AB0DD',
          400: '#4A8FC4',
          500: '#1B3A5C',
          600: '#162F4C',
          700: '#11243B',
          800: '#0C192B',
          900: '#070E1A',
        },
        accent: {
          50:  '#E0F7F6',
          100: '#B3ECEB',
          200: '#80E0DE',
          300: '#4DD4D1',
          400: '#2DB5B0',
          500: '#2DB5B0',
          600: '#249C97',
          700: '#1B837E',
          800: '#126A66',
          900: '#09514D',
        },
      },
    },
  },
  plugins: [],
};
