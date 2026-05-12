export interface CorrectiveActionResponse {
  description: string;
  responsible: string;
  result: string;
  appliedAt: string;
}

export interface IncidentResponse {
  id: string | number;
  organizationId: number;
  assetId: number;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  detectedAt: string;
  recognizedAt: string | null;
  resolvedAt: string | null;
  correctiveAction: CorrectiveActionResponse | null;
}
