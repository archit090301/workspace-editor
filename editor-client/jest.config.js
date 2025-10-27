export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",  // use babel-jest for JSX + JS
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy", // mock CSS imports
  },
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
};
