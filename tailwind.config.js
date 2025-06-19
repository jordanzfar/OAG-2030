/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))', // #4D4D4D at ~30% opacity on #0D0D0D -> approx hsl(0 0% 20%)
				input: 'hsl(var(--input))', // #4D4D4D at ~20% opacity -> approx hsl(0 0% 15%)
				ring: 'hsl(var(--ring))', // Bronze #CD7F32
				background: 'hsl(var(--background))', // #0D0D0D
				foreground: 'hsl(var(--foreground))', // White 90% opacity -> approx hsl(0 0% 90%)
				primary: {
					DEFAULT: 'hsl(var(--primary))', // Bronze #CD7F32
					foreground: 'hsl(var(--primary-foreground))', // Dark text for bronze
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))', // Gray #4D4D4D
					foreground: 'hsl(var(--secondary-foreground))', // White 90%
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))', // Default Red
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))', // Darker Gray #2a2a2a
					foreground: 'hsl(var(--muted-foreground))', // Lighter gray text
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))', // Hover/Focus - Use a slightly lighter gray or subtle bronze
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))', // Slightly lighter than background
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))', // Slightly lighter than background
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)', // 8px
				md: 'calc(var(--radius) - 2px)', // 6px
				sm: 'calc(var(--radius) - 4px)', // 4px
			},
			boxShadow: {
        sm: '0 1px 2px 0 hsla(var(--shadow-color), 0.05)',
        DEFAULT: '0 1px 3px 0 hsla(var(--shadow-color), 0.1), 0 1px 2px -1px hsla(var(--shadow-color), 0.1)',
        md: '0 4px 6px -1px hsla(var(--shadow-color), 0.1), 0 2px 4px -2px hsla(var(--shadow-color), 0.1)',
        lg: '0 10px 15px -3px hsla(var(--shadow-color), 0.1), 0 4px 6px -4px hsla(var(--shadow-color), 0.1)',
        xl: '0 20px 25px -5px hsla(var(--shadow-color), 0.1), 0 8px 10px -6px hsla(var(--shadow-color), 0.1)',
        '2xl': '0 25px 50px -12px hsla(var(--shadow-color), 0.25)',
        inner: 'inset 0 2px 4px 0 hsla(var(--shadow-color), 0.05)',
      },
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};