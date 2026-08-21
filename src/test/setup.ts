import '@testing-library/jest-dom';

// Polyfill DOM element scroll methods for headless runner
window.HTMLElement.prototype.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};