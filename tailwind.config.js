/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                poker: {
                    felt: '#35654d',
                    dark: '#1a1a1a',
                    gold: '#d4af37',
                }
            }
        },
    },
    plugins: [],
}
