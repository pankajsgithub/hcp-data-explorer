import { describe, it, expect } from 'vitest';
import { sanitizeTheme } from './theme';

describe('sanitizeTheme', () => {
  it('falls back to default colors for invalid hex codes and missing properties', () => {
    const invalidConfig = {
      appName: 'Custom App',
      primary: 'not-a-color',
      radius: 999, // out of range, falls back to default 8
    };

    const sanitized = sanitizeTheme(invalidConfig);
    expect(sanitized.appName).toBe('Custom App');
    expect(sanitized.primary).toBe('#0B5FA5'); // default fallback
    expect(sanitized.radius).toBe(8); // fallback default
  });

  it('preserves valid tenant configurations', () => {
    const validConfig = {
      appName: 'Aurelia Pharma',
      primary: '#7C3AED',
      onPrimary: '#FFFFFF',
      background: '#FAF5FF',
      surface: '#F3E8FF',
      text: '#3B0764',
      radius: 12,
    };

    const sanitized = sanitizeTheme(validConfig);
    expect(sanitized).toEqual(validConfig);
  });
});