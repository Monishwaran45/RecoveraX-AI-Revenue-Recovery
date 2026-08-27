import { INITIAL_CASES, INITIAL_METRICS } from "./mockData";
import { RecoveryCase, DashboardMetrics, ModifyActionInput, AuditEvent } from "./types";

class RecoveryStore {
  private cases: RecoveryCase[] = [...INITIAL_CASES];
  private metrics: DashboardMetrics = { ...INITIAL_METRICS };
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getMetrics(): DashboardMetrics {
    // Recalculate recovered totals dynamically based on state
    const recoveredCases = this.cases.filter((c) => c.status === "RECOVERED");
    const recoveredSum = recoveredCases.reduce((sum, c) => sum + c.amount, 0);

    const pendingApprovalsCount = this.cases.filter((c) => c.status === "HUMAN_APPROVAL").length;
    const autoCasesCount = this.cases.filter((c) => c.policyDecision.type === "AUTO").length;
    const blockedCasesCount = this.cases.filter((c) => c.status === "BLOCKED").length;

    return {
      ...this.metrics,
      grossRecovered: INITIAL_METRICS.grossRecovered + recoveredSum,
      incrementalRecovered: INITIAL_METRICS.incrementalRecovered + recoveredSum,
      decisionDistribution: {
        auto: autoCasesCount + 420,
        human: pendingApprovalsCount + 278,
        blocked: blockedCasesCount + 82,
      },
    };
  }

  public getCases(filters?: {
    search?: string;
    status?: string;
    risk?: string;
    type?: string;
  }): RecoveryCase[] {
    let result = [...this.cases];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.problem.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== "All") {
      if (filters.status === "Open") {
        result = result.filter((c) => c.status === "OPEN" || c.status === "SCHEDULED" || c.status === "HUMAN_APPROVAL");
      } else if (filters.status === "Scheduled") {
        result = result.filter((c) => c.status === "SCHEDULED");
      } else if (filters.status === "Human Approval") {
        result = result.filter((c) => c.status === "HUMAN_APPROVAL");
      } else if (filters.status === "Recovered") {
        result = result.filter((c) => c.status === "RECOVERED");
      } else if (filters.status === "Blocked") {
        result = result.filter((c) => c.status === "BLOCKED");
      }
    }

    if (filters?.risk && filters.risk !== "All") {
      result = result.filter((c) => c.risk.toUpperCase() === filters.risk?.toUpperCase());
    }

    if (filters?.type && filters.type !== "All") {
      const typeMap: Record<string, string> = {
        "Failed Payment": "FAILED_PAYMENT",
        Subscription: "SUBSCRIPTION",
        Checkout: "CHECKOUT",
        Invoice: "INVOICE",
      };
      const mapped = typeMap[filters.type] || filters.type;
      result = result.filter((c) => c.type === mapped);
    }

    return result;
  }

  public getCaseById(id: string): RecoveryCase | undefined {
    return this.cases.find((c) => c.id.toUpperCase() === id.toUpperCase());
  }

  public getApprovalQueue(): RecoveryCase[] {
    return this.cases.filter((c) => c.status === "HUMAN_APPROVAL");
  }

  public approveCase(id: string): RecoveryCase | undefined {
    const target = this.getCaseById(id);
    if (!target) return undefined;

    target.status = "SCHEDULED"; // Moves to approved/scheduled status
    target.policyDecision.type = "HUMAN";
    target.policyDecision.decisionLabel = "APPROVED BY HUMAN";
    target.policyDecision.explanation = "Action manually approved by merchant operator.";

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newEvent: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: timeStr,
      title: "Approved by Human Operator",
      description: `Merchant staff authorized retry strategy for ₹${target.amount.toLocaleString("en-IN")}.`,
      category: "HUMAN",
      badgeText: "APPROVED BY HUMAN",
    };

    target.auditTimeline.push(newEvent);
    target.updatedAt = new Date().toISOString();

    this.notify();
    return target;
  }

  public rejectCase(id: string): RecoveryCase | undefined {
    const target = this.getCaseById(id);
    if (!target) return undefined;

    target.status = "REJECTED";
    target.policyDecision.decisionLabel = "REJECTED BY HUMAN";
    target.policyDecision.explanation = "Action manually rejected by merchant operator. Case closed without retry.";

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newEvent: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: timeStr,
      title: "Rejected by Human Operator",
      description: "Merchant staff rejected recovery action. Case dismissed.",
      category: "HUMAN",
      badgeText: "REJECTED BY HUMAN",
    };

    target.auditTimeline.push(newEvent);
    target.updatedAt = new Date().toISOString();

    this.notify();
    return target;
  }

  public modifyCase(id: string, input: ModifyActionInput): RecoveryCase | undefined {
    const target = this.getCaseById(id);
    if (!target) return undefined;

    target.status = "MODIFIED";
    target.scheduledDelayMinutes = input.delayMinutes;
    if (input.maxRetries) {
      target.maxRetries = input.maxRetries;
    }

    target.policyDecision.decisionLabel = "MODIFIED BY HUMAN";
    target.policyDecision.explanation = `Human operator adjusted retry schedule to ${input.delayMinutes} minutes.${input.notes ? ` Notes: ${input.notes}` : ""}`;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newEvent: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: timeStr,
      title: "Modified by Human Operator",
      description: `Schedule adjusted to ${input.delayMinutes}m delay.${input.notes ? ` Notes: ${input.notes}` : ""}`,
      category: "HUMAN",
      badgeText: "MODIFIED BY HUMAN",
    };

    target.auditTimeline.push(newEvent);
    target.updatedAt = new Date().toISOString();

    this.notify();
    return target;
  }

  public recheckPayment(id: string): RecoveryCase | undefined {
    const target = this.getCaseById(id);
    if (!target) return undefined;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newEvent: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: timeStr,
      title: "Payment State Re-checked",
      description: "Queried banking gateway for current settlement status. Payment still failed (No customer debit).",
      category: "SYSTEM",
    };

    target.auditTimeline.push(newEvent);
    target.updatedAt = new Date().toISOString();

    this.notify();
    return target;
  }

  public markRecovered(id: string): RecoveryCase | undefined {
    const target = this.getCaseById(id);
    if (!target) return undefined;

    target.status = "RECOVERED";
    target.retryCount += 1;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const newEvent1: AuditEvent = {
      id: `audit-${Date.now()}-1`,
      timestamp: timeStr,
      title: "Retry Executed",
      description: `Dispatched payment retry payload to gateway for ₹${target.amount.toLocaleString("en-IN")}.`,
      category: "ACTION",
    };

    const newEvent2: AuditEvent = {
      id: `audit-${Date.now()}-2`,
      timestamp: timeStr,
      title: "Payment Successful",
      description: `Gateway returned SUCCESS response code. ₹${target.amount.toLocaleString("en-IN")} recovered successfully.`,
      category: "SYSTEM",
      badgeText: "RECOVERED",
    };

    target.auditTimeline.push(newEvent1, newEvent2);
    target.updatedAt = new Date().toISOString();

    this.notify();
    return target;
  }
}

export const store = new RecoveryStore();
