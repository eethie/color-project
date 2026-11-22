module.exports = {
    clearMocks: true,
    testTimeout: 20000,
    projects: [
        {
            displayName: "unit",
            testEnvironment: "jsdom",
            testEnvironmentOptions: {
                url: "http://localhost/colors.html"
            },
            testMatch: ["<rootDir>/tests/unit/**/*.test.js"]
        },
        {
            displayName: "integration",
            testEnvironment: "node",
            testMatch: ["<rootDir>/tests/integration/**/*.test.js"]
        }
    ]
};
