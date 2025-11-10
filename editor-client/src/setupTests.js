import "@testing-library/jest-dom";

// src/setupTests.js

// Polyfill for react-router / socket.io / TextEncoder issues
import { TextEncoder, TextDecoder } from "util";
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

// Mock browser-only APIs that Jest’s Node env lacks
Object.defineProperty(global, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(global, "scrollTo", { value: jest.fn(), writable: true });

// Silence React Router “useLayoutEffect” warnings in jsdom
jest.spyOn(console, "error").mockImplementation((msg) => {
  if (!msg?.toString().includes("useLayoutEffect")) console.warn(msg);
});
