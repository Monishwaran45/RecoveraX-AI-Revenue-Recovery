import { BACKEND_URL } from "./config";

export interface AuditRecord {
  id: string;
  case_id: string;
  event_type: string;
  actor_type: string;
  actor_id: string;
  reason?: string;
  metadata_json?: any;
  timestamp: string;
}

export async function getCaseAuditLogs(caseId: string): Promise<AuditRecord[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/cases/${caseId}/audit`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Audit logs fetch failed for case", caseId);
  }
  return [];
}
