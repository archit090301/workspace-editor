export default {
  testEnvironment: "node",
  verbose: true,
  testTimeout: 20000,

  forceExit: true,
  detectOpenHandles: true,

  // IMPORTANT: do NOT include extensionsToTreatAsEsm
  transform: {},

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1.js"
  }
};
