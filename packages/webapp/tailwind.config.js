const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
    purge: ["./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {},
        screens: {
            xs: "475px",
            ...defaultTheme.screens,
        },
    },
    variants: {
        extend: {
            margin: ["last"],
        },
    },
    plugins: [],
};
