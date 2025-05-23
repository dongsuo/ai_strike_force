/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  safelist: [
    // 保留所有可能动态生成的样式类
    'bg-primary-50',
    'bg-primary-100',
    'bg-primary-200',
    'text-primary-500',
    'text-primary-600',
    'text-primary-700',
    'border-primary-100',
    'border-primary-200',
    'border-primary-300',
    'hover:bg-primary-50',
    'hover:border-primary-300',
    'focus-within:border-primary-400',
    'focus-within:border-primary-500',
    'from-primary-50',
    'to-default-50',
    'bg-default-50',
    'bg-default-100',
    'bg-white',
    'border-default-100',
    'border-default-200',
    'border-default-300',
    'hover:bg-default-50',
    'hover:bg-default-100',
    'text-default-400',
    'text-default-500',
    'text-default-700',
    'rounded-lg',
    'rounded-md',
    'truncate',
    'shadow-lg',
    'shadow-sm',
    'overflow-hidden',
    'group',
    'group-hover:rotate-180',
    'transition-transform',
    'duration-200',
    'py-2',
    'font-medium',
    'px-1.5',
    'py-0.5',
    'inline-flex',
    'items-center',
    'mr-1.5',
    'ml-1',
    'justify-between',
    'transition-all',
    'w-full',
    'flex',
    'text-sm',
    'text-xs'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
    },
  },
  plugins: [],
};