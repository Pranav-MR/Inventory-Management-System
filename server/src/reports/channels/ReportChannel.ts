import type { InventoryReportData } from '../../services/report.service.js';

export interface ReportChannel {
  readonly type: string;
  send(report: InventoryReportData, destination: string): Promise<void>;
}
