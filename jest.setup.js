import '@testing-library/jest-dom';

// Mock Prism.js globally for all tests
global.Prism = {
  highlight: jest.fn((code, grammar, language) => code),
  languages: {
    json: {},
    yaml: {},
    bash: {},
    javascript: {},
    typescript: {},
    python: {},
    css: {},
    scss: {},
    markdown: {},
  },
};

// Mock window.open for link tests
Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
});
