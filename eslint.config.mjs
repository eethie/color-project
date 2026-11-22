import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        files: ["js/**/*.js"],
        languageOptions: {
            sourceType: "script",
            globals: globals.browser
        }
    },
    {
        files: ["js/login.js"],
        languageOptions: {
            globals: { md5: "readonly" }
        }
    },
    {
        files: ["*.{cjs,mjs}", "tests/**/*.js"],
        languageOptions: {
            globals: globals.node
        }
    },
    {
        files: ["tests/**/*.test.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: globals.jest
        }
    },
    {
        files: ["tests/unit/**/*.test.js"],
        languageOptions: {
            globals: globals.browser
        }
    }
];
