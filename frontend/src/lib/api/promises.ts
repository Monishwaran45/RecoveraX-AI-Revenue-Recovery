import { BACKEND_URL } from "./config";

export interface PromiseToPayRecord {
  id: string;
  case_id: string;
  promised_amount: number;
  promised_date: string;
  status: "PROMISED" | "P2P_KEPT" | "P2P_BROKEN" | "EXPIRED";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function createPromiseToPay(
  caseId: string,
  input: { promisedAmount: number; promisedDate: string; notes?: string }
): Promise<PromiseToPayRecord> {
  const res = await fetch(`${BACKEND_URL}/cases/${caseId}/p2p`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      promised_amount: input.promisedAmount,
      promised_date: input.promisedDate,
      notes: input.notes || null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to record promise-to-pay commitment.`);
  }

  return await res.json();
}

export async function getPromisesToPay(caseId: string): Promise<PromiseToPayRecord[]> {
  const res = await fetch(`${BACKEND_URL}/cases/${caseId}/p2p`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  return await res.json();
}

export async function verifyPromiseToPay(
  caseId: string,
  promiseId?: string
): Promise<PromiseToPayRecord> {
  const res = await fetch(`${BACKEND_URL}/cases/${caseId}/p2p/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promise_id: promiseId || null }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to verify promise-to-pay commitment.`);
  }

  return await res.json();
}

export async function updatePromiseToPay(
  caseId: string,
  promiseId: string,
  input: { promisedAmount: number; promisedDate: string; notes?: string }
): Promise<PromiseToPayRecord> {
  const res = await fetch(`${BACKEND_URL}/cases/${caseId}/p2p/${promiseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      promised_amount: input.promisedAmount,
      promised_date: input.promisedDate,
      notes: input.notes || null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update promise-to-pay commitment.`);
  }

  return await res.json();
}

export async function deletePromiseToPay(caseId: string, promiseId?: string): Promise<boolean> {
  const url = promiseId ? `${BACKEND_URL}/cases/${caseId}/p2p?promise_id=${promiseId}` : `${BACKEND_URL}/cases/${caseId}/p2p`;
  const res = await fetch(url, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete promise-to-pay commitment.`);
  }

  const data = await res.json();
  return data.success ?? true;
}
