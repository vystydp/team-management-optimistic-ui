import '@testing-library/jest-dom';

// Mock global fetch for PorscheIcon SVG loading
global.fetch = jest.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve('<svg></svg>'),
    ok: true,
  } as Response)
) as jest.Mock;

// Suppress React 18 act() warnings from react-aria focus management
// These are safe async updates that happen during user interactions
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
