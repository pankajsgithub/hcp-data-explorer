import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { HcpRecord } from '../starter/data-generator';

interface HcpGridProps {
    records: HcpRecord[];
    renderDuration: number;
}

export const HcpGrid: React.FC<HcpGridProps> = ({ records, renderDuration }) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: records.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 40,
        overscan: 15,
    });

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div className="grid-wrapper">
            {/* Header */}
            <div className="grid-header">
                <div className="col-id">ID</div>
                <div className="col-name">HCP NAME</div>
                <div className="col-specialty">SPECIALTY</div>
                <div className="col-region">REGION</div>
                <div className="col-territory">TERRITORY</div>
                <div className="col-num">CALLS</div>
                <div className="col-num">TRX</div>
                <div className="col-num">NRX</div>
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
                        const row = records[virtualRow.index];
                        const rowKey = `${row.id}_${virtualRow.index}`;

                        return (
                            <div
                                key={rowKey}
                                className="grid-row"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <div className="col-id">{row.id}</div>
                                <div className="col-name">{row.name}</div>
                                <div className="col-specialty">
                                    {row.specialty ?? <span className="null-value">null</span>}
                                </div>
                                <div className="col-region">{row.region}</div>
                                <div className="col-territory">{row.territory}</div>
                                <div className="col-num">{row.calls}</div>
                                <div className="col-num">{row.trx.toLocaleString()}</div>
                                <div className="col-num">{row.nrx.toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Live Metrics Bar */}
            <div className="grid-footer">
                <div>
                    Rows in DOM: <strong>{virtualItems.length}</strong> of{' '}
                    <strong>{records.length.toLocaleString()}</strong>
                </div>
                <div>
                    Last render / calculation: <strong>{renderDuration.toFixed(2)} ms</strong>
                </div>
            </div>
        </div>
    );
};