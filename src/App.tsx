import { useState, useEffect } from 'react';
import { TENANT_THEMES, DEFAULT_THEME } from './starter/theme-config';
import { sanitizeTheme, applyThemeToCssVariables } from './utils/theme';
import './App.css';

export function App() {
  const [selectedTenant, setSelectedTenant] = useState<string>('default');
  const [activeTheme, setActiveTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    const rawConfig = selectedTenant === 'default' ? DEFAULT_THEME : TENANT_THEMES[selectedTenant];
    const sanitized = sanitizeTheme(rawConfig);
    setActiveTheme(sanitized);
    applyThemeToCssVariables(sanitized);
  }, [selectedTenant]);

  return (
    <div style={{ padding: '20px' }}>
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
            <option value="meridian">Meridian (Invalid Hex & Radius)</option>
          </select>
        </div>
      </header>
      <div style={{ padding: '16px', background: 'var(--color-surface)', borderRadius: 'var(--border-radius)' }}>
        Theme Test Surface: Radius is {activeTheme.radius}px, Primary is {activeTheme.primary}.
      </div>
    </div>
  );
}

export default App;