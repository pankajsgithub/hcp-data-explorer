import { describe, it, expect } from 'vitest';
import { calculateCPI, buildFlattenedGridData } from './aggregation';
import type { HcpRecord } from '../starter/data-generator';
import type { CellEditState, SortConfig } from '../types';

describe('calculateCPI', () => {
  it('calculates rounded integer percentage accurately', () => {
    expect(calculateCPI(25, 100)).toBe(25);
    expect(calculateCPI(1, 3)).toBe(33);
    expect(calculateCPI(12, 50)).toBe(24);
  });

  it('safely handles zero TRx by returning null to prevent NaN or Infinity', () => {
    expect(calculateCPI(10, 0)).toBeNull();
    expect(calculateCPI(0, 0)).toBeNull();
  });

  it('safely handles non-numeric dirty values', () => {
    expect(calculateCPI(NaN, 100)).toBeNull();
    expect(calculateCPI(10, NaN)).toBeNull();
  });
});

describe('buildFlattenedGridData', () => {
  const mockRecords: HcpRecord[] = [
    { id: 'HCP-001', name: 'Dr. Alpha', specialty: 'Oncology', region: 'West', territory: 'T1', calls: 10, trx: 100, nrx: 40 },
    { id: 'HCP-002', name: 'Dr. Beta', specialty: 'Cardiology', region: 'West', territory: 'T1', calls: '20' as any, trx: 200, nrx: 60 },
    { id: 'HCP-003', name: 'Dr. Gamma', specialty: 'Pediatrics', region: 'Midwest', territory: 'T2', calls: 15, trx: 0, nrx: 10 },
  ];

  const defaultSort: SortConfig = { column: 'calls', direction: null };

  it('correctly builds two-level grouped hierarchy with calculated aggregates', () => {
    const flattened = buildFlattenedGridData(mockRecords, new Set(), '', 'All', defaultSort, {});

    // Level 1: West Region header
    const westRegion = flattened.find((r) => r.type === 'group' && r.data.level === 'region' && r.data.region === 'West');
    expect(westRegion).toBeDefined();
    if (westRegion && westRegion.type === 'group') {
      expect(westRegion.data.totalCalls).toBe(30); // 10 + 20 (handles string coercion)
      expect(westRegion.data.totalTrx).toBe(300);
      expect(westRegion.data.cpi).toBe(10); // (30 / 300) * 100
      expect(westRegion.data.count).toBe(2);
    }

    // Zero TRx Region handles CPI safely
    const midwestRegion = flattened.find((r) => r.type === 'group' && r.data.level === 'region' && r.data.region === 'Midwest');
    if (midwestRegion && midwestRegion.type === 'group') {
      expect(midwestRegion.data.cpi).toBeNull();
    }
  });

  it('strictly excludes pending edits from live subtotals and includes saved edits', () => {
    const editsWithPending: Record<string, CellEditState> = {
      'HCP-001_0': { value: 50, status: 'pending', timestamp: Date.now() },
    };

    // West Region total calls must remain 30 (not 70) while edit is pending
    const dataPending = buildFlattenedGridData(mockRecords, new Set(), '', 'All', defaultSort, editsWithPending);
    const westGroupPending = dataPending.find((r) => r.type === 'group' && r.data.region === 'West');
    if (westGroupPending && westGroupPending.type === 'group') {
      expect(westGroupPending.data.totalCalls).toBe(30);
    }

    // West Region total calls updates to 70 once saved
    const editsWithSaved: Record<string, CellEditState> = {
      'HCP-001_0': { value: 50, status: 'saved', timestamp: Date.now() },
    };
    const dataSaved = buildFlattenedGridData(mockRecords, new Set(), '', 'All', defaultSort, editsWithSaved);
    const westGroupSaved = dataSaved.find((r) => r.type === 'group' && r.data.region === 'West');
    if (westGroupSaved && westGroupSaved.type === 'group') {
      expect(westGroupSaved.data.totalCalls).toBe(70); // 50 + 20
    }
  });

  it('filters by region correctly', () => {
    const filtered = buildFlattenedGridData(mockRecords, new Set(), '', 'Midwest', defaultSort, {});
    const regions = filtered.filter((r) => r.type === 'group' && r.data.level === 'region');
    expect(regions.length).toBe(1);
    if (regions[0].type === 'group') {
      expect(regions[0].data.region).toBe('Midwest');
    }
  });

  it('auto-expands groups on search query match', () => {
    const collapsed = new Set(['group_region_West', 'group_terr_West_T1']);
    const searched = buildFlattenedGridData(mockRecords, collapsed, 'Alpha', 'All', defaultSort, {});

    const westGroup = searched.find((r) => r.type === 'group' && r.data.region === 'West');
    if (westGroup && westGroup.type === 'group') {
      expect(westGroup.data.collapsed).toBe(false);
    }
    const recordAlpha = searched.find((r) => r.type === 'record' && r.data.id === 'HCP-001');
    expect(recordAlpha).toBeDefined();
  });
});