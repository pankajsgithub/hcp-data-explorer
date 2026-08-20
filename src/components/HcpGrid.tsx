import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { FlattenedRow } from '../types';
import { calculateCPI } from '../utils/aggregation';

interface HcpGridProps {
  rows: FlattenedRow[];
  totalSourceRecords: number;
  renderDuration: number;
  onToggleGroup: (groupKey: string) => void;
}

export const HcpGrid: React.FC<HcpGridProps> = ({
  rows,
  totalSourceRecords,
  renderDuration,
  onToggleGroup,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="grid-wrapper">
      {/* Grid Header matching wireframe */}
      <div className="grid-header">
        <div className="col-id">ID</div>
        <div className="col-name">HCP NAME</div>
        <div className="col-specialty">SPECIALTY</div>
        <div className="col-num">CALLS</div>
        <div className="col-num">TRX</div>
        <div className="col-num">NRX</div>
        <div className="col-cpi">CPI</div>
      </div>

      {/* Virtual Viewport */}
      <div
        ref={parentRef}
        className="grid-viewport"
        style={{ height: '600px', overflowY: 'auto', position: 'relative' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const rowItem = rows[virtualRow.index];

            // 1. Render Group Header Row (FR-2)
            if (rowItem.type === 'group') {
              const group = rowItem.data;
              const isRegion = group.level === 'region';

              return (
                <div
                  key={group.key}
                  className={isRegion ? 'grid-row-group-region' : 'grid-row-group-territory'}
                  onClick={() => onToggleGroup(group.key)}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="group-title">
                    <span className="toggle-arrow">{group.collapsed ? '▶' : '▼'}</span>
                    <span>
                      {isRegion ? group.region : `${group.region} / ${group.territory}`}
                    </span>
                    <span className="group-count">({group.count.toLocaleString()} HCPs)</span>
                  </div>
                  <div className="col-num">{group.totalCalls.toLocaleString()}</div>
                  <div className="col-num">{group.totalTrx.toLocaleString()}</div>
                  <div className="col-num">{group.totalNrx.toLocaleString()}</div>
                  <div className="col-cpi">{group.cpi ?? '—'}</div>
                </div>
              );
            }

            // 2. Render Leaf HCP Record Row
            const rec = rowItem.data;
            const callsNum = typeof rec.calls === 'number' ? rec.calls : Number(rec.calls) || 0;
            const cpi = calculateCPI(callsNum, rec.trx);

            return (
              <div
                key={rowItem.rowKey}
                className="grid-row-leaf"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="col-id">{rec.id}</div>
                <div className="col-name">{rec.name}</div>
                <div className="col-specialty">
                  {rec.specialty ?? <span className="null-value">null</span>}
                </div>
                <div className="col-num">{rec.calls}</div>
                <div className="col-num">{rec.trx.toLocaleString()}</div>
                <div className="col-num">{rec.nrx.toLocaleString()}</div>
                <div className="col-cpi">{cpi ?? '—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Footer (FR-1) */}
      <div className="grid-footer">
        <div>
          Visible Rows in DOM: <strong>{virtualItems.length}</strong> (Flattened items:{' '}
          <strong>{rows.length.toLocaleString()}</strong> of{' '}
          <strong>{totalSourceRecords.toLocaleString()}</strong> records)
        </div>
        <div>
          Last aggregation: <strong>{renderDuration.toFixed(2)} ms</strong>
        </div>
      </div>
    </div>
  );
};