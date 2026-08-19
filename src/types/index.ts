import type { HcpRecord } from '../starter/data-generator';

export type EditStatus = 'idle' | 'pending' | 'saved' | 'rejected';

export interface CellEditState {
  value: number;
  status: EditStatus;
  rejectionReason?: string;
  timestamp: number;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: keyof HcpRecord | 'cpi';
  direction: SortDirection;
}

export interface GroupAggregate {
  level: 'region' | 'territory';
  key: string;
  region: string;
  territory?: string;
  count: number;
  totalCalls: number;
  totalTrx: number;
  totalNrx: number;
  cpi: number | null;
  collapsed: boolean;
}

export type FlattenedRow =
  | { type: 'group'; data: GroupAggregate }
  | { type: 'record'; data: HcpRecord; rowKey: string };