module.exports = {
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["/node_modules/", "/lib/","/test-lib/"], 
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  moduleNameMapper: {
    "\\.(css|scss|less)$": "identity-obj-proxy",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!d3|d3-array|internmap|delaunator|robust-predicates)"
  ],
  transform: {
    "^.+\\.jsx?$": "babel-jest", // Use Babel for JavaScript files
  },
};
