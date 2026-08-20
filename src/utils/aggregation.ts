import { type HcpRecord } from '../starter/data-generator';
import type { FlattenedRow, GroupAggregate } from '../types';

/**
 * Computes CPI safely, returning null on zero division to prevent NaN/Infinity
 */
export function calculateCPI(calls: number, trx: number): number | null {
  if (trx <= 0 || isNaN(calls) || isNaN(trx)) {
    return null;
  }
  return Math.round((calls / trx) * 100);
}

/**
 * Groups 50,000 records into Region -> Territory
 */
export function buildFlattenedGridData(
  records: HcpRecord[],
  collapsedGroups: Set<string>
): FlattenedRow[] {
  // 1. Group records into nested maps: Region -> Territory -> Items
  const tree = new Map<string, Map<string, { record: HcpRecord; rowKey: string }[]>>();

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowKey = `${row.id}_${i}`;

    if (!tree.has(row.region)) {
      tree.set(row.region, new Map());
    }
    const territoryMap = tree.get(row.region)!;

    if (!territoryMap.has(row.territory)) {
      territoryMap.set(row.territory, []);
    }
    territoryMap.get(row.territory)!.push({ record: row, rowKey });
  }

  const flattened: FlattenedRow[] = [];

  // 2. Iterate hierarchy and calculate group subtotals
  for (const [region, territoryMap] of tree.entries()) {
    let regionCalls = 0;
    let regionTrx = 0;
    let regionNrx = 0;
    let regionCount = 0;

    const territoryRows: FlattenedRow[] = [];
    const regionKey = `group_region_${region}`;
    const isRegionCollapsed = collapsedGroups.has(regionKey);

    for (const [territory, items] of territoryMap.entries()) {
      let terrCalls = 0;
      let terrTrx = 0;
      let terrNrx = 0;

      items.forEach(({ record }) => {
        const parsedCalls = typeof record.calls === 'number' ? record.calls : Number(record.calls) || 0;
        terrCalls += parsedCalls;
        terrTrx += record.trx;
        terrNrx += record.nrx;
      });

      const terrCount = items.length;
      const terrKey = `group_terr_${region}_${territory}`;
      const isTerrCollapsed = collapsedGroups.has(terrKey);

      const terrAggregate: GroupAggregate = {
        level: 'territory',
        key: terrKey,
        region,
        territory,
        count: terrCount,
        totalCalls: terrCalls,
        totalTrx: terrTrx,
        totalNrx: terrNrx,
        cpi: calculateCPI(terrCalls, terrTrx),
        collapsed: isTerrCollapsed,
      };

      // Add Territory group header
      territoryRows.push({ type: 'group', data: terrAggregate });

      // If territory is expanded, add its leaf HCP records
      if (!isTerrCollapsed) {
        items.forEach((item) => {
          territoryRows.push({ type: 'record', data: item.record, rowKey: item.rowKey });
        });
      }

      // Roll up to region subtotal
      regionCalls += terrCalls;
      regionTrx += terrTrx;
      regionNrx += terrNrx;
      regionCount += terrCount;
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

    // Add Region group header
    flattened.push({ type: 'group', data: regionAggregate });

    // If region is expanded, include child territory rows
    if (!isRegionCollapsed) {
      flattened.push(...territoryRows);
    }
  }

  return flattened;
}