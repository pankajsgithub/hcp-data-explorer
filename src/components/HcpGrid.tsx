import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CellEditState, FlattenedRow, SortConfig } from '../types';
import type { HcpRecord } from '../starter/data-generator';
import { calculateCPI } from '../utils/aggregation';

interface HcpGridProps {
  rows: FlattenedRow[];
  totalSourceRecords: number;
  renderDuration: number;
  sortConfig: SortConfig;
  edits: Record<string, CellEditState>;
  onSort: (column: keyof HcpRecord | 'cpi') => void;
  onToggleGroup: (groupKey: string) => void;
  onCommitEdit: (rowKey: string, val: number, original: number | string) => void;
}

export const HcpGrid: React.FC<HcpGridProps> = ({
  rows,
  totalSourceRecords,
  renderDuration,
  sortConfig,
  edits,
  onSort,
  onToggleGroup,
  onCommitEdit,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const renderSortIndicator = (col: keyof HcpRecord | 'cpi') => {
    if (sortConfig.column !== col || sortConfig.direction === null) {
      return <span style={{ opacity: 0.35, marginLeft: '4px' }}>↕</span>;
    }
    return (
      <span style={{ marginLeft: '4px', color: 'var(--color-primary)' }}>
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="grid-wrapper">
      {/* 3-State Sortable Grid Header */}
      <div className="grid-header">
        <div className="col-id" style={{ cursor: 'pointer' }} onClick={() => onSort('id')}>
          ID {renderSortIndicator('id')}
        </div>
        <div className="col-name" style={{ cursor: 'pointer' }} onClick={() => onSort('name')}>
          HCP NAME {renderSortIndicator('name')}
        </div>
        <div className="col-specialty" style={{ cursor: 'pointer' }} onClick={() => onSort('specialty')}>
          SPECIALTY {renderSortIndicator('specialty')}
        </div>
        <div className="col-num" style={{ cursor: 'pointer' }} onClick={() => onSort('calls')}>
          CALLS {renderSortIndicator('calls')}
        </div>
        <div className="col-num" style={{ cursor: 'pointer' }} onClick={() => onSort('trx')}>
          TRX {renderSortIndicator('trx')}
        </div>
        <div className="col-num" style={{ cursor: 'pointer' }} onClick={() => onSort('nrx')}>
          NRX {renderSortIndicator('nrx')}
        </div>
        <div className="col-cpi" style={{ cursor: 'pointer' }} onClick={() => onSort('cpi')}>
          CPI {renderSortIndicator('cpi')}
        </div>
      </div>

      {/* Virtual Viewport */}
      <div ref={parentRef} className="grid-viewport">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const rowItem = rows[virtualRow.index];

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

            const rec = rowItem.data;
            const edit = edits[rowItem.rowKey];
            const currentVal =
              edit !== undefined
                ? edit.value
                : typeof rec.calls === 'number'
                ? rec.calls
                : Number(rec.calls) || 0;
            const cpi = calculateCPI(currentVal, rec.trx);
            const statusClass = edit ? `status-${edit.status}` : '';

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
                {/* Editable Calls Cell (FR-4) */}
                <div className="col-num">
                  <div className="cell-input-wrapper">
                    <input
                      type="number"
                      className={`cell-input ${statusClass}`}
                      disabled={edit?.status === 'pending'}
                      defaultValue={currentVal}
                      key={`${rowItem.rowKey}_${currentVal}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onBlur={(e) => {
                        const nextVal = Number(e.target.value);
                        if (!isNaN(nextVal)) {
                          onCommitEdit(rowItem.rowKey, nextVal, rec.calls);
                        }
                      }}
                    />
                    {edit?.status === 'rejected' && (
                      <span className="cell-reject-icon" title={edit.rejectionReason}>
                        ⚠️
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-num">{rec.trx.toLocaleString()}</div>
                <div className="col-num">{rec.nrx.toLocaleString()}</div>
                <div className="col-cpi">{cpi ?? '—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid-footer">
        <div>
          Visible in DOM: <strong>{virtualItems.length}</strong> (Flattened items:{' '}
          <strong>{rows.length.toLocaleString()}</strong> of{' '}
          <strong>{totalSourceRecords.toLocaleString()}</strong> records)
        </div>
        <div>
          Last aggregation & edit cycle: <strong>{renderDuration.toFixed(2)} ms</strong>
        </div>
      </div>
    </div>
  );
};