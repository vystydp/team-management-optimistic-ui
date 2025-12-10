import '@testing-library/jest-dom';

// Mock global fetch for PorscheIcon SVG loading
global.fetch = jest.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve('<svg></svg>'),
    ok: true,
  } as Response)
) as jest.Mock;
