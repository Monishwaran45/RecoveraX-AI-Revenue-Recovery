import { RecoveryCase, ModifyActionInput } from "../types";
import { BACKEND_URL } from "./config";
import { getCase, getCases } from "./cases";

export async function getApprovalCases(): Promise<RecoveryCase[]> {
  return await getCases({ status: "Human Approval", limit: 1000 });
}

export async function approveCase(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "Human operator approved AI recommendation" }),
  });
  if (!res.ok) {
    throw new Error(`Failed to approve case ${id} via backend API: HTTP ${res.status}`);
  }
  return await getCase(id);
}

export async function rejectCase(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "Human operator rejected recovery retry" }),
  });
  if (!res.ok) {
    throw new Error(`Failed to reject case ${id} via backend API: HTTP ${res.status}`);
  }
  return await getCase(id);
}

export async function modifyCase(id: string, data: ModifyActionInput): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/modify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: data.action ? data.action.toUpperCase() : "RETRY",
      delay_minutes: data.delayMinutes,
      reason: data.notes || "Human operator modified action",
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to modify case ${id} via backend API: HTTP ${res.status}`);
  }
  return await getCase(id);
}

export async function recheckPayment(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/recheck`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to recheck payment for case ${id} via backend API: HTTP ${res.status}`);
  }
  return await getCase(id);
}

export async function executeRetry(id: string): Promise<RecoveryCase> {
  const res = await fetch(`${BACKEND_URL}/cases/${id}/execute`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to execute retry for case ${id} via backend API: HTTP ${res.status}`);
  }
  return await getCase(id);
}

export async function verifyPayment(id: string): Promise<{ verified: boolean; amount: number }> {
  const c = await getCase(id);
  return {
    verified: (c?.status as string) === "RECOVERED" || (c?.status as string) === "Recovered",
    amount: c?.amount || 0,
  };
}
