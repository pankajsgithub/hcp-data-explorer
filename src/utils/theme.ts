import { DEFAULT_THEME } from '../starter/theme-config';
import type { TenantTheme } from '../starter/theme-config';

const isValidHex = (hex: unknown): boolean =>
  typeof hex === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(hex);

export function sanitizeTheme(rawConfig?: Partial<TenantTheme>): TenantTheme {
  if (!rawConfig) return DEFAULT_THEME;

  const validRadius =
    typeof rawConfig.radius === 'number' &&
    !isNaN(rawConfig.radius) &&
    rawConfig.radius >= 0 &&
    rawConfig.radius <= 24;

  return {
    appName:
      typeof rawConfig.appName === 'string' && rawConfig.appName.trim().length > 0
        ? rawConfig.appName
        : DEFAULT_THEME.appName,
    primary: isValidHex(rawConfig.primary) ? (rawConfig.primary as string) : DEFAULT_THEME.primary,
    onPrimary: isValidHex(rawConfig.onPrimary) ? (rawConfig.onPrimary as string) : DEFAULT_THEME.onPrimary,
    background: isValidHex(rawConfig.background) ? (rawConfig.background as string) : DEFAULT_THEME.background,
    surface: isValidHex(rawConfig.surface) ? (rawConfig.surface as string) : DEFAULT_THEME.surface,
    text: isValidHex(rawConfig.text) ? (rawConfig.text as string) : DEFAULT_THEME.text,
    radius: validRadius ? (rawConfig.radius as number) : DEFAULT_THEME.radius,
  };
}

export function applyThemeToCssVariables(theme: TenantTheme): void {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-on-primary', theme.onPrimary);
  root.style.setProperty('--color-background', theme.background);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--border-radius', `${theme.radius}px`);
}