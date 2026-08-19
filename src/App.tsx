import { useState, useEffect } from 'react';
import { TENANT_THEMES, DEFAULT_THEME, type TenantTheme } from './starter/theme-config';
import { sanitizeTheme, applyThemeToCssVariables } from './utils/theme';
import './App.css';

// Additional Custom test config to visually verify runtime CSS variable changes
const DEMO_DARK_THEME: Partial<TenantTheme> = {
  appName: 'Dark Enterprise IQ',
  primary: '#10B981', // Emerald green
  onPrimary: '#FFFFFF',
  background: '#0F172A', // Slate dark
  surface: '#1E293B',
  text: '#F8FAFC',
  radius: 16,
};

export function App() {
  const [selectedTenant, setSelectedTenant] = useState<string>('default');
  const [activeTheme, setActiveTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    let rawConfig: Partial<TenantTheme> | undefined;

    if (selectedTenant === 'default') {
      rawConfig = DEFAULT_THEME;
    } else if (selectedTenant === 'demo_dark') {
      rawConfig = DEMO_DARK_THEME;
    } else {
      rawConfig = TENANT_THEMES[selectedTenant];
    }

    const sanitized = sanitizeTheme(rawConfig);
    setActiveTheme(sanitized);
    applyThemeToCssVariables(sanitized);
  }, [selectedTenant]);

  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header className="app-header">
        <h1 style={{ margin: 0, fontSize: '20px' }}>{activeTheme.appName}</h1>
        <div>
          <label style={{ marginRight: '8px', fontSize: '14px' }}>Tenant Theme: </label>
          <select
            className="theme-select"
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="aurelia">Aurelia</option>
            <option value="meridian">Meridian (Fallback Test)</option>
            <option value="demo_dark">Demo Green/Dark Theme</option>
          </select>
        </div>
      </header>

      <div style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: 'var(--border-radius)', border: '1px solid #e2e8f0' }}>
        <p><strong>Active Theme:</strong> {activeTheme.appName}</p>
        <p><strong>Primary Color:</strong> {activeTheme.primary}</p>
        <p><strong>Border Radius:</strong> {activeTheme.radius}px</p>
      </div>
    </div>
  );
}

export default App;