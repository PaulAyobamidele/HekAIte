module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#111113',
          900: '#191A1F',
          800: '#1C1C21',
          700: '#222226',
          600: '#2C2C32',
          500: '#3A3A42',
        },
        accent: {
          DEFAULT: '#7C5CFC',
          purple: '#7C5CFC',
          blue: '#3E63DD',
          cyan: '#36B5CA',
          green: '#30A46C',
          orange: '#FF8B3E',
          red: '#E5484D',
          yellow: '#FFB224',
        }
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    }
  },
  plugins: []
};
