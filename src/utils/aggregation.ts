import type { HcpRecord } from '../starter/data-generator';
import type { CellEditState, FlattenedRow, GroupAggregate, SortConfig, SortDirection } from '../types';

export function calculateCPI(calls: number, trx: number): number | null {
  if (trx <= 0 || isNaN(calls) || isNaN(trx)) {
    return null;
  }
  return Math.round((calls / trx) * 100);
}

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  if (direction === null) return 0;
  const mod = direction === 'asc' ? 1 : -1;

  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * mod;
  }

  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  return strA.localeCompare(strB, undefined, { numeric: true }) * mod;
}

export function buildFlattenedGridData(
  records: HcpRecord[],
  collapsedGroups: Set<string>,
  searchTerm: string,
  regionFilter: string,
  sortConfig: SortConfig,
  edits: Record<string, CellEditState>
): FlattenedRow[] {
  const query = searchTerm.trim().toLowerCase();
  const isSearching = query.length > 0;

  const tree = new Map<string, Map<string, { record: HcpRecord; rowKey: string }[]>>();

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowKey = `${row.id}_${i}`;

    // Apply region filter if active
    if (regionFilter !== 'All' && row.region !== regionFilter) {
      continue;
    }

    // Apply search filter if active
    if (isSearching) {
      const matchName = row.name.toLowerCase().includes(query);
      const matchId = row.id.toLowerCase().includes(query);
      if (!matchName && !matchId) continue;
    }

    if (!tree.has(row.region)) {
      tree.set(row.region, new Map());
    }
    const territoryMap = tree.get(row.region)!;

    if (!territoryMap.has(row.territory)) {
      territoryMap.set(row.territory, []);
    }
    territoryMap.get(row.territory)!.push({ record: row, rowKey });
  }
  // Build aggregated group objects for regions and territories, then flatten into a single array for rendering
  interface RegionAggEntry {
    aggregate: GroupAggregate;
    territoryRows: {
      aggregate: GroupAggregate;
      items: { record: HcpRecord; rowKey: string }[];
    }[];
  }

  const regionAggregates: RegionAggEntry[] = [];

  for (const [region, territoryMap] of tree.entries()) {
    let regionCalls = 0;
    let regionTrx = 0;
    let regionNrx = 0;
    let regionCount = 0;

    const territoryAggList: RegionAggEntry['territoryRows'] = [];
    const regionKey = `group_region_${region}`;
    // Auto-expand groups when searching
    const isRegionCollapsed = isSearching ? false : collapsedGroups.has(regionKey);

    for (const [territory, items] of territoryMap.entries()) {
      let terrCalls = 0;
      let terrTrx = 0;
      let terrNrx = 0;

      items.forEach(({ record, rowKey }) => {
        const edit = edits[rowKey];
        // Pending edits are strictly excluded from aggregates; only saved edits apply (FR-2 / FR-4)
        const activeCalls =
          edit && edit.status === 'saved'
            ? edit.value
            : typeof record.calls === 'number'
            ? record.calls
            : Number(record.calls) || 0;

        terrCalls += activeCalls;
        terrTrx += record.trx;
        terrNrx += record.nrx;
      });

      const terrKey = `group_terr_${region}_${territory}`;
      const isTerrCollapsed = isSearching ? false : collapsedGroups.has(terrKey);

      const terrAggregate: GroupAggregate = {
        level: 'territory',
        key: terrKey,
        region,
        territory,
        count: items.length,
        totalCalls: terrCalls,
        totalTrx: terrTrx,
        totalNrx: terrNrx,
        cpi: calculateCPI(terrCalls, terrTrx),
        collapsed: isTerrCollapsed,
      };

      // Sort items inside territory
      const sortedItems = [...items];
      if (sortConfig.direction) {
        sortedItems.sort((a, b) => {
          let valA: unknown;
          let valB: unknown;

          const getCallsValue = (item: { record: HcpRecord; rowKey: string }) => {
            const ed = edits[item.rowKey];
            return ed && ed.status === 'saved'
              ? ed.value
              : typeof item.record.calls === 'number'
              ? item.record.calls
              : Number(item.record.calls) || 0;
          };

          if (sortConfig.column === 'cpi') {
            valA = calculateCPI(getCallsValue(a), a.record.trx);
            valB = calculateCPI(getCallsValue(b), b.record.trx);
          } else if (sortConfig.column === 'calls') {
            valA = getCallsValue(a);
            valB = getCallsValue(b);
          } else {
            valA = a.record[sortConfig.column as keyof HcpRecord];
            valB = b.record[sortConfig.column as keyof HcpRecord];
          }

          return compareValues(valA, valB, sortConfig.direction);
        });
      }

      territoryAggList.push({ aggregate: terrAggregate, items: sortedItems });

      regionCalls += terrCalls;
      regionTrx += terrTrx;
      regionNrx += terrNrx;
      regionCount += items.length;
    }

    const regionAggregate: GroupAggregate = {
      level: 'region',
      key: regionKey,
      region,
      count: regionCount,
      totalCalls: regionCalls,
      totalTrx: regionTrx,
      totalNrx: regionNrx,
      cpi: calculateCPI(regionCalls, regionTrx),
      collapsed: isRegionCollapsed,
    };

    regionAggregates.push({ aggregate: regionAggregate, territoryRows: territoryAggList });
  }

  // Sort groups by aggregate value
  if (sortConfig.direction) {
    const getGroupValue = (agg: GroupAggregate) => {
      switch (sortConfig.column) {
        case 'calls': return agg.totalCalls;
        case 'trx': return agg.totalTrx;
        case 'nrx': return agg.totalNrx;
        case 'cpi': return agg.cpi;
        default: return agg.region;
      }
    };

    // Sort regions
    regionAggregates.sort((a, b) =>
      compareValues(getGroupValue(a.aggregate), getGroupValue(b.aggregate), sortConfig.direction)
    );

    // Sort territories within each region
    regionAggregates.forEach((reg) => {
      reg.territoryRows.sort((a, b) =>
        compareValues(getGroupValue(a.aggregate), getGroupValue(b.aggregate), sortConfig.direction)
      );
    });
  }

  // Flatten the hierarchical structure into a single array for rendering
  const flattened: FlattenedRow[] = [];

  for (const reg of regionAggregates) {
    flattened.push({ type: 'group', data: reg.aggregate });

    if (!reg.aggregate.collapsed) {
      for (const terr of reg.territoryRows) {
        flattened.push({ type: 'group', data: terr.aggregate });

        if (!terr.aggregate.collapsed) {
          terr.items.forEach((item) => {
            flattened.push({ type: 'record', data: item.record, rowKey: item.rowKey });
          });
        }
      }
    }
  }

  return flattened;
}