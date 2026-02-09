import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "var(--color-primary)",
                "primary-dark": "var(--color-primary-dark)",
                "accent": "var(--color-accent)",
                "accent-light": "var(--color-accent-light)",
                "background-light": "var(--color-background-light)",
                "text-main": "var(--color-text-main)",
                "text-sub": "var(--color-text-sub)",
            },
            fontFamily: {
                "display": "var(--font-display)",
                "body": "var(--font-body)",
            },
            borderRadius: {
                "none": "0",
                "sm": "calc(var(--radius) - 4px)",
                "DEFAULT": "var(--radius)",
                "md": "var(--radius)",
                "lg": "var(--radius)",
                "xl": "calc(var(--radius) + 4px)",
                "2xl": "calc(var(--radius) + 8px)",
                "3xl": "calc(var(--radius) + 12px)",
                "full": "9999px",
            },
            boxShadow: {
                'soft': '0 10px 30px -10px rgba(11, 60, 73, 0.08)',
                'card': '0 0 0 1px rgba(11, 60, 73, 0.04), 0 20px 40px -15px rgba(11, 60, 73, 0.1)',
            }
        },
    },
    plugins: [
        typography,
        forms,
        containerQueries,
    ],
}
