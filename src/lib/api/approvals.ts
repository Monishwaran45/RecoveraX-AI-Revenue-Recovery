import { store } from "../store";
import { RecoveryCase, ModifyActionInput } from "../types";
import { BACKEND_URL } from "./config";
import { getCase } from "./cases";

export async function getApprovalCases(): Promise<RecoveryCase[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/approvals`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const caseIds = data.map((item: any) => item.case_id);
        const cases = await Promise.all(caseIds.map((id: string) => getCase(id)));
        return cases.filter((c): c is RecoveryCase => c !== undefined);
      }
    }
  } catch (e) {
    // Fallback to store
  }
  return store.getApprovalQueue();
}

export async function approveCase(id: string): Promise<RecoveryCase | undefined> {
  try {
    const res = await fetch(`${BACKEND_URL}/cases/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Human operator approved AI recommendation" }),
    });
    if (res.ok) {
      store.approveCase(id);
      return await getCase(id);
    }
  } catch (e) {
    // Fallback to store
  }
  return store.approveCase(id);
}

export async function rejectCase(id: string): Promise<RecoveryCase | undefined> {
  try {
    const res = await fetch(`${BACKEND_URL}/cases/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Human operator rejected recovery retry" }),
    });
    if (res.ok) {
      store.rejectCase(id);
      return await getCase(id);
    }
  } catch (e) {
    // Fallback to store
  }
  return store.rejectCase(id);
}

export async function modifyCase(id: string, data: ModifyActionInput): Promise<RecoveryCase | undefined> {
  try {
    const res = await fetch(`${BACKEND_URL}/cases/${id}/modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: data.action ? data.action.toUpperCase() : "RETRY",
        delay_minutes: data.delayMinutes,
        reason: data.notes || "Human operator modified action",
      }),
    });
    if (res.ok) {
      store.modifyCase(id, data);
      return await getCase(id);
    }
  } catch (e) {
    // Fallback to store
  }
  return store.modifyCase(id, data);
}

export async function recheckPayment(id: string): Promise<RecoveryCase | undefined> {
  try {
    const res = await fetch(`${BACKEND_URL}/cases/${id}/recheck`, {
      method: "POST",
    });
    if (res.ok) {
      store.recheckPayment(id);
      return await getCase(id);
    }
  } catch (e) {
    // Fallback to store
  }
  return store.recheckPayment(id);
}

export async function executeRetry(id: string): Promise<RecoveryCase | undefined> {
  try {
    const res = await fetch(`${BACKEND_URL}/cases/${id}/execute`, {
      method: "POST",
    });
    if (res.ok) {
      store.markRecovered(id);
      return await getCase(id);
    }
  } catch (e) {
    // Fallback to store
  }
  return store.markRecovered(id);
}

export async function verifyPayment(id: string): Promise<{ verified: boolean; amount: number }> {
  const c = await getCase(id);
  return {
    verified: (c?.status as string) === "RECOVERED" || (c?.status as string) === "Recovered",
    amount: c?.amount || 0,
  };
}
