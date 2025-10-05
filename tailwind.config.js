module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1E40AF', // customize if needed
                secondary: '#F59E0B'
            },
            borderRadius: {
                xl: '1rem',
                '2xl': '1.5rem',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),
    ],
}