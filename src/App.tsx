import { useState, useEffect, useMemo } from 'react';
import { generateRows } from './starter/data-generator';
import { TENANT_THEMES, DEFAULT_THEME, type TenantTheme } from './starter/theme-config';
import { sanitizeTheme, applyThemeToCssVariables } from './utils/theme';
import { HcpGrid } from './components/HcpGrid';
import './App.css';

// Custom test config to visually verify runtime CSS variable changes
const DEMO_DARK_THEME: Partial<TenantTheme> = {
  appName: 'Dark Enterprise IQ',
  primary: '#10B981',
  onPrimary: '#FFFFFF',
  background: '#0F172A',
  surface: '#535b68',
  text: '#4a4c4c',
  radius: 16,
};

export function App() {
  const [selectedTenant, setSelectedTenant] = useState<string>('default');
  const [activeTheme, setActiveTheme] = useState<TenantTheme>(DEFAULT_THEME);

  // Generate 50,000 deterministic records
  const { rawRecords, renderDuration } = useMemo(() => {
    const startTime = performance.now();
    const data = generateRows(42, 50000);
    const endTime = performance.now();
    return {
      rawRecords: data,
      renderDuration: endTime - startTime,
    };
  }, []);

  // Update theme when selection changes
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
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
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

      <main>
        <HcpGrid records={rawRecords} renderDuration={renderDuration} />
      </main>
    </div>
  );
}

export default App;