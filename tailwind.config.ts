import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mountain-inspired palette
        ridge: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c8d7c9',
          300: '#9fb8a1',
          400: '#6f9373',
          500: '#4d7550',
          600: '#3b5d3e',
          700: '#314b33',
          800: '#293d2b',
          900: '#233225',
          950: '#111c13',
        },
        sunset: {
          50: '#fdf6f3',
          100: '#fceae3',
          200: '#fad8cb',
          300: '#f5bda6',
          400: '#ee9778',
          500: '#e4734f',
          600: '#d15a35',
          700: '#ae4729',
          800: '#903d26',
          900: '#773625',
          950: '#401910',
        },
        sky: {
          50: '#f3f8fc',
          100: '#e6f0f8',
          200: '#c7e0f0',
          300: '#96c7e4',
          400: '#5ea8d4',
          500: '#3a8dc0',
          600: '#2a71a2',
          700: '#235b84',
          800: '#214d6e',
          900: '#20415c',
          950: '#152a3d',
        },
        stone: {
          50: '#f9f9f8',
          100: '#f3f2f0',
          200: '#e5e3de',
          300: '#d3cfc6',
          400: '#b8b2a5',
          500: '#a29a8a',
          600: '#8f8575',
          700: '#776e61',
          800: '#635c52',
          900: '#524d45',
          950: '#2b2924',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      backgroundImage: {
        'mountain-gradient': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
        'ridge-pattern': `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L15 8 L30 15 L50 3 L70 12 L85 6 L100 14 L100 20 Z' fill='%234d7550' fill-opacity='0.08'/%3E%3C/svg%3E")`,
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
