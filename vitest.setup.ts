import '@testing-library/jest-dom/vitest';

// Polyfill for scrollIntoView in jsdom
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}
