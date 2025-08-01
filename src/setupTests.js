// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock jsPDF to prevent errors in JSDOM environment
jest.mock('jspdf', () => ({
  jsPDF: function () {
    return {
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      setTextColor: jest.fn(),
      text: jest.fn(),
      addPage: jest.fn(),
      output: jest.fn(() => ''),
      save: jest.fn(),
      internal: { pageSize: { getWidth: () => 0, getHeight: () => 0 } }
    };
  }
}));

// Some dependencies rely on `setImmediate`. JSDOM doesn't provide it by default
// so we polyfill it here for tests.
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}
