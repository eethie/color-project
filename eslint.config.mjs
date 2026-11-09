import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ...js.configs.recommended,
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
    }
];
