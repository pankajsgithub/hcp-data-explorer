import { useState, useEffect, useMemo, useCallback } from 'react';
import { generateRows } from './starter/data-generator';
import { TENANT_THEMES, DEFAULT_THEME, type TenantTheme } from './starter/theme-config';
import { sanitizeTheme, applyThemeToCssVariables } from './utils/theme';
import { buildFlattenedGridData } from './utils/aggregation';
import { HcpGrid } from './components/HcpGrid';
import type { SortConfig, SortDirection } from './types';
import type { HcpRecord } from './starter/data-generator';
import './App.css';

const DEMO_DARK_THEME: Partial<TenantTheme> = {
  appName: 'Dark Enterprise IQ',
  primary: '#10B981',
  onPrimary: '#FFFFFF',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  radius: 16,
};

const REGIONS_LIST = ['All', 'Midwest', 'National', 'Northeast', 'Southeast', 'Southwest', 'West'];

export function App() {
  const [selectedTenant, setSelectedTenant] = useState<string>('default');
  const [activeTheme, setActiveTheme] = useState<TenantTheme>(DEFAULT_THEME);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'calls', direction: null });

  // 1. Generate 50,000 deterministic records once
  const rawRecords = useMemo(() => generateRows(42, 50000), []);

  // 2. Build filtered, sorted, flattened grid data
  const { flattenedRows, aggregationDuration } = useMemo(() => {
    const start = performance.now();
    const rows = buildFlattenedGridData(
      rawRecords,
      collapsedGroups,
      searchTerm,
      regionFilter,
      sortConfig
    );
    const end = performance.now();
    return {
      flattenedRows: rows,
      aggregationDuration: end - start,
    };
  }, [rawRecords, collapsedGroups, searchTerm, regionFilter, sortConfig]);

  // 3. Toggle group expand / collapse
  const handleToggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  // 4. 3-State Column Sorting Cycle: asc -> desc -> none
  const handleSort = useCallback((column: keyof HcpRecord | 'cpi') => {
    setSortConfig((prev) => {
      if (prev.column !== column) {
        return { column, direction: 'asc' };
      }
      const nextDir: SortDirection =
        prev.direction === null ? 'asc' : prev.direction === 'asc' ? 'desc' : null;
      return { column, direction: nextDir };
    });
  }, []);

  // 5. Update theme
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
    <div style={{ padding: '16px 24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* App Header */}
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

      {/* Filter & Search Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search name or ID (e.g. HCP-000578)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-strong)',
            width: '300px',
            fontSize: '14px',
            outline: 'none',
          }}
        />

        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-strong)',
            fontSize: '14px',
            background: '#ffffff',
            outline: 'none',
          }}
        >
          {REGIONS_LIST.map((reg) => (
            <option key={reg} value={reg}>
              {reg === 'All' ? 'All Regions' : reg}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <main>
        <HcpGrid
          rows={flattenedRows}
          totalSourceRecords={rawRecords.length}
          renderDuration={aggregationDuration}
          sortConfig={sortConfig}
          onSort={handleSort}
          onToggleGroup={handleToggleGroup}
        />
      </main>
    </div>
  );
}

export default App;