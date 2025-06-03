module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // ✅ Ensure this points to the right setup file
    transform: {
      "^.+\\.jsx?$": "babel-jest" // ✅ Ensures Jest transforms JSX
    }
  };