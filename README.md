# RecoveraX — AI-Revenue-Recovery

[![Continuous Integration (CI)](https://github.com/Monishwaran45/AI-Revenue-Recovery/actions/workflows/ci.yml/badge.svg)](https://github.com/Monishwaran45/AI-Revenue-Recovery/actions/workflows/ci.yml)
[![Continuous Deployment (CD)](https://github.com/Monishwaran45/AI-Revenue-Recovery/actions/workflows/cd.yml/badge.svg)](https://github.com/Monishwaran45/AI-Revenue-Recovery/actions/workflows/cd.yml)
[![Nightly Verification](https://github.com/Monishwaran45/AI-Revenue-Recovery/actions/workflows/nightly.yml/badge.svg)](https://github.com/Monishwaran45/AI-Revenue-Recovery/actions/workflows/nightly.yml)
[![CI/CD Documentation](https://img.shields.io/badge/CI%2FCD-Docs-blue)](docs/CICD_PIPELINE.md)

> Autonomous AI Revenue Recovery Engine — LangGraph + Groq (`qwen/qwen3.8-27b`) + Deterministic Policy Guardrails + Human-in-the-Loop (HITL) + Celery/Redis + LangSmith Observability.

RecoveraX detects revenue at risk, diagnoses root cause failure patterns using **Groq LLM (`qwen/qwen3.8-27b`)**, calculates deterministic recovery scores, evaluates strict **financial safety guardrails**, routes high-risk or high-value actions to **Human-in-the-Loop (HITL) approval**, executes approved recovery retries, verifies settlement outcomes, and maintains an **immutable audit trail**.

> **CI/CD Pipeline**: Automated Continuous Integration (Backend Pytest, Frontend Next.js build, TypeScript typecheck, Docker verification) & Continuous Deployment (Render & Vercel) are documented in [`docs/CICD_PIPELINE.md`](file:///c:/Users/Asus-2025/Downloads/Razorpay%20AI%20Buildathon/docs/CICD_PIPELINE.md).


---

## Safety Contract

> **The AI recommends; the deterministic policy engine authorizes; execution is blocked for HUMAN/BLOCK states until the required authorization is satisfied. A case is shown as RECOVERED only after verified payment success.**

---

## Workflow Of The Application

![RecoveraX AI Revenue Recovery Workflow Architecture](docs/images/Flow.png)

```mermaid
graph TD
    A["Failed Transaction Event<br/>(Razorpay Webhook / Gateway Error)"] --> B["Ingestion & Context Loading<br/>(Customer History, LTV, Error Code)"]
    B --> C["Groq LLM Diagnosis<br/>(qwen/qwen3.8-27b)"]
    C --> D["Deterministic Recovery Scoring<br/>(0–100 Score & $EV$ Calculation)"]
    D --> E["Strategy Recommendation<br/>(RETRY, REMIND, ESCALATE, STOP)"]
    E --> F{"Deterministic Policy Guardrails"}
    
    F -- AUTO --> G["Celery Worker Scheduling"]
    F -- HUMAN --> H["HITL Merchant Approval Queue"]
    F -- BLOCK / STOP --> I["Hard Safety Halt & Audit Log"]
    
    H -- Merchant Approves --> G
    H -- Merchant Rejects --> I
    
    G --> J["Fresh Gateway Pre-Check (recheck)<br/>(Prevent Duplicate Debits)"]
    J -- Clear State --> K["Execute Retry Dispatch (execute)"]
    J -- Already Debited / External Payment --> I
    
    K --> L["Bank Gateway Settlement Verification (verify)"]
    L -- Verified Success --> M["RECOVERED State & Audit Logging"]
    L -- Gateway Failed --> N["Re-evaluate Max Retries (reevaluate)"]
    
    N -- Retries Remaining --> C
    N -- Max Retries Reached --> I
```

### Key Architectural Principles
1. **Scoped LLM Authority**:
   - The LLM is **ONLY** responsible for failure diagnosis, reasoning over structured customer payment history, and generating recovery strategy recommendations (`RETRY`, `REMIND`, `ESCALATE`, `STOP`).
   - The LLM **NEVER**: Executes payments, authorizes financial transfers, overrides safety policies, or calculates monetary totals.
2. **Deterministic Policy Engine Has Final Authority**:
   - All authorization decisions (`AUTO`, `HUMAN`, `BLOCK`, `STOP`) are evaluated in pure Python.
   - Fail-closed security guarantee: Any policy exception or ambiguous state defaults to `BLOCK` or `STOP`, **NEVER** `AUTO`. Human sign-off cannot override a hard safety stop.
3. **Transparent Recovery Scoring & EV**:
   - Scores cases 0–100 deterministically based on diagnosis, customer LTV, past payment history, and recency.
   - Expected Recovery Value ($EV$) calculated in Python:
     $$EV = \text{amount\_at\_risk} \times \left(\frac{\text{recovery\_score}}{100}\right) - \text{costs}$$

---

## LangGraph Workflow Architecture

RecoveraX implements a stateful **cyclic execution graph** in LangGraph ([`backend/app/agents/graph.py`](file:///c:/Users/Asus-2025/Downloads/Razorpay%20AI%20Buildathon/backend/app/agents/graph.py)):

![RecoveraX AI Revenue Recovery Workflow Architecture](docs/images/Agent%20Workflow%28Langgraph%29.png)


```mermaid
graph TD
    Node1["1. load_context"] --> Node2["2. diagnose (Groq Qwen 3.8 27B)"]
    Node2 --> Node3["3. calculate_score"]
    Node3 --> Node4["4. recommend_action"]
    Node4 --> Node5["5. policy_check (Safety Guardrails)"]
    
    Node5 -- AUTO --> Node7["7. schedule"]
    Node5 -- HUMAN --> Node6["6. human_approval"]
    Node5 -- BLOCK / STOP --> Node11["11. stop"]

    Node6 --> END1((END - Awaiting Sign-off))
    
    Node7 --> Node8["8. recheck (Fresh Pre-Check)"]
    Node8 --> Node9["9. execute (Retry Dispatch)"]
    Node9 --> Node10["10. verify (Bank Settlement)"]
    
    Node10 -- Verified Success --> END2((END - Recovered))
    Node10 -- Gateway Failed --> Node12["12. reevaluate"]
    
    Node12 -- Max Retries (2) Reached --> Node11
    Node12 -- Retry Allowed --> Node2
    
    Node11 --> END3((END - Hard Blocked / Stopped))
```

### Execution Process Table

| Node # | Node Identifier | Subsystem / Engine | Detailed Action & Responsibilities |
| :--- | :--- | :--- | :--- |
| **01** | `load_context` | Data Layer | Ingests transaction failure context, customer LTV, past payment history, and gateway error payloads into `RecoveryState`. |
| **02** | `diagnose` | Groq LLM Engine | Invokes LLM (`qwen/qwen3.8-27b`) to reason over failure codes and output structured diagnosis (`INSUFFICIENT_FUNDS`, `TEMPORARY_BANK_ERROR`, `CARD_EXPIRED`, etc.). |
| **03** | `calculate_score` | Recovery Scorer | Deterministically calculates Recovery Score (0–100) and Expected Recovery Value ($EV$) based on customer LTV, recency, and past payment reliability. |
| **04** | `recommend_action` | Action Recommender | Selects optimal recovery strategy (`RETRY`, `REMIND`, `ESCALATE`, `STOP`) and recommended execution delay. |
| **05** | `policy_check` | Safety Policy Engine | Evaluates pure Python safety rules. Authorizes decision: `AUTO` (safe to auto-retry), `HUMAN` (requires merchant approval), or `BLOCK` / `STOP`. |
| **06** | `human_approval` | HITL Queue | Routes high-value or medium-risk cases to merchant approval queue and pauses execution graph until sign-off. |
| **07** | `schedule` | Celery Worker Queue | Enqueues automated retry countdown task into background worker queue for execution. |
| **08** | `recheck` | Gateway Pre-Check | Performs mandatory fresh pre-execution API check with bank gateway to verify payment state hasn't cleared externally. |
| **09** | `execute` | Gateway Simulator | Dispatches automated retry payload attempt to payment network (Card / UPI / Netbanking). |
| **10** | `verify` | Settlement Engine | Queries bank gateway settlement status to verify debit response (`VERIFIED_SUCCESS` vs `FAILED`). |
| **11** | `reevaluate` | Loop Controller | Re-evaluates attempt outcome against max retries (max 2 retries). Routes back to `diagnose` for secondary attempt or `stop`. |
| **12** | `stop` | Audit Logger | Safely halts pipeline execution, records immutable audit trail, and prevents duplicate charges. |

---

## LangSmith Observability & Tracing Architecture

RecoveraX embeds **LangSmith** as a centralized observability and tracing layer ([`backend/app/observability/langsmith.py`](file:///c:/Users/Asus-2025/Downloads/Razorpay%20AI%20Buildathon/backend/app/observability/langsmith.py)):

```mermaid
graph TD
    subgraph Execution ["RecoveraX Core Engine"]
        FastAPI["FastAPI REST Routes"]
        LangGraph["Stateful Cyclic LangGraph Workflow"]
        Groq["Groq LLM (qwen/qwen3.8-27b)"]
        PolicyEngine["Deterministic Safety Policy"]
        Simulator["Payment Gateway Simulator"]
    end

    subgraph Observability ["Observability Layer (Passive Only)"]
        LangSmith["LangSmith Dashboard & Tracing"]
        Sanitizer["Data Sanitizer (Redacts Credentials)"]
        TraceLogger["Run Spans, Latency & Error Metrics"]
    end

    LangGraph -. Traces & Tags .-> Sanitizer
    Groq -. LLM Token & Latency .-> Sanitizer
    Simulator -. Outcome State .-> Sanitizer
    Sanitizer --> LangSmith
    LangSmith --> TraceLogger
```

---

---

## Simulator Benchmark — 1,000 Synthetic Payment Cases

> **Empirical Evaluation**: RecoveraX evaluates performance through a 1,000-case synthetic payment simulator benchmark comparing naive blind retries against our guardrailed AI engine. *(Note: Metrics reflect simulator benchmark evaluation, not live Razorpay merchant production data).*

### Simulator Benchmark Outcomes (1,000 Synthetic Payment Cases)

| Metric | Baseline Strategy (Blind Retry) | RecoveraX AI Engine (Guardrailed) | Incremental Lift |
| :--- | :--- | :--- | :--- |
| **Total Volume Evaluated** | ₹50,00,000 (₹50.0L) | ₹50,00,000 (₹50.0L) | 1,000 Synthetic Cases |
| **Baseline Recovery** | **₹12,50,000 (₹12.5L)** | — | 25.0% Baseline Rate |
| **RecoveraX Recovery** | — | **₹34,80,000 (₹34.8L)** | 69.6% Guardrailed Rate |
| **Incremental Revenue Lift** | — | — | **+₹22,30,000 (+₹22.3L Net Lift)** |
| **Double Debit Safety Violations** | 14 Duplicate Debits | **0 Duplicate Debits (0%)** | 100% Double Debit Prevention |
| **Ambiguous State Safety Blocks** | 0 (Blind Retry Dispatched) | **1 Case Hard-Blocked** | Zero Fraud/Double Charge Exposure |
| **High-Exposure Operator Reviews** | 0 (Uncontrolled) | **713 Cases Routed** | Full HITL Risk Control (>₹50k) |

### Key Quantified Takeaways:
1. **Quantified Monetary Recovery**: RecoveraX achieved **₹34.8L total recovery** vs **₹12.5L baseline**, delivering **+₹22.3L incremental lift** on the 1,000 synthetic case benchmark cohort.
2. **Zero Financial Safety Violations**: Prevented 14 potential duplicate customer debits through state-verified pre-execution checks (`recheck` node).
3. **Automated vs Human Split**: **28.7%** low-risk cases auto-executed safely; **71.3%** high-value/risk cases required explicit human operator authorization.

---

## Deterministic Safety Rules

1. **Rule 1 (`MAX_AUTO_RETRY_AMOUNT = ₹50,000`)**: Transactions exceeding threshold require **HUMAN** approval.
2. **Rule 2 (`MIN_AUTO_RECOVERY_SCORE = 80`)**: Recovery scores < 80 require **HUMAN** approval or **BLOCK**.
3. **Rule 3 (`AMBIGUOUS_PAYMENT = BLOCK`)**: Ambiguous payment states are **ALWAYS** blocked from auto-retry.
4. **Rule 4 (`POSSIBLE_CUSTOMER_DEBIT = BLOCK`)**: If customer might already be debited, retry is **BLOCKED**.
5. **Rule 5 (`FRAUD_SIGNAL = BLOCK`)**: Fraud signals cause an immediate **BLOCK**.
6. **Rule 6 (`MAX_RETRIES = 2`)**: Maximum 2 retries allowed per case.
7. **Rule 7 (`PERMANENT_FAILURE = STOP`)**: Closed accounts or invalid details cause hard **STOP**.
8. **Rule 11 (`MANDATE_COOLOFF_PROTECTION`)**: Auto-debit mandate retries (`NACH`, `E_MANDATE`, `UPI_AUTOPAY`) enforce a **48-hour minimum cool-off guardrail** to prevent bank dishonor/bounce fee penalties (₹250–₹500/bounce).

```mermaid
graph TD
    Input["Input Case Data & AI Recommendation"] --> R1{"Already Successful?"}
    R1 -- Yes --> S_STOP["Decision: STOP"]
    R1 -- No --> R2{"Payment State Ambiguous?"}
    
    R2 -- Yes --> S_BLOCK["Decision: BLOCK"]
    R2 -- No --> R3{"Possible Customer Debit?"}
    
    R3 -- Yes --> S_BLOCK
    R3 -- No --> R4{"Fraud Signal Present?"}
    
    R4 -- Yes --> S_BLOCK
    R4 -- No --> R5{"Retry Count >= Max Retries (2)?"}
    
    R5 -- Yes --> S_STOP
    R5 -- No --> R6{"Permanent Failure Code?"}
    
    R6 -- Yes --> S_STOP
    R6 -- No --> R7{"Action != RETRY?"}
    
    R7 -- Yes --> S_HUMAN["Decision: HUMAN"]
    R7 -- No --> R8{"Payment State != CLEAR?"}
    
    R8 -- Yes --> S_BLOCK
    R8 -- No --> R9{"Amount > ₹50,000?"}
    
    R9 -- Yes --> S_HUMAN
    R9 -- No --> R10{"Recovery Score < 80?"}
    
    R10 -- Yes --> S_HUMAN
    R10 -- No --> R11{"Mandate Payment Method?"}
    
    R11 -- Yes --> Cooloff["Enforce 48h Minimum Cool-Off Guardrail"]
    R11 -- No --> R12{"Risk Level == LOW?"}
    Cooloff --> R12
    
    R12 -- Yes --> S_AUTO["Decision: AUTO"]
    R12 -- No --> S_HUMAN
```

---

## Mandate & E-Mandate Retry Sequencer

RecoveraX includes a specialized **Mandate Presentation Window Sequencer** ([`backend/app/policy/mandate_sequencer.py`](file:///c:/Users/Asus-2025/Downloads/Razorpay%20AI%20Buildathon/backend/app/policy/mandate_sequencer.py)) tailored for Indian recurring auto-debit networks (`NACH`, `E_MANDATE`, `UPI_AUTOPAY`):

1. **NPCI Clearing Batch Cycle Alignment**:
   - Automatically aligns retry schedules with NPCI clearing windows: **Morning Batch (09:00 AM IST)** and **Evening Batch (17:00 PM IST)**.
2. **Salary & Liquidity Window Matching**:
   - For `INSUFFICIENT_FUNDS` failures, maps retry presentation to customer salary credit days (1st, 5th, 7th, 10th, 25th of the month) when bank balances reload.
3. **100% Dishonor Fee Protection Guardrail**:
   - Enforces a minimum 48-hour cool-off before 2nd mandate re-presentation, eliminating bank bounce fee charges for merchants and customers.

```mermaid
graph TD
    M1["Mandate Transaction Failure<br/>(NACH / E-Mandate / UPI Autopay)"] --> M2{"Check Payment Method"}
    M2 -- Non-Mandate --> M3["Apply Short Standard Delay<br/>(30 Minutes)"]
    M2 -- Mandate Method --> M4["Enforce Dishonor Fee Cool-Off<br/>(48 Hours Minimum)"]
    
    M4 --> M5{"Diagnosis: INSUFFICIENT_FUNDS?"}
    M5 -- Yes --> M6["Match Salary Credit Window<br/>(1st, 5th, 7th, 10th, 25th)"]
    M5 -- No --> M7["Proceed to NPCI Batch Alignment"]
    M6 --> M7
    
    M7 --> M8{"NPCI Clearing Window Selection"}
    M8 -- Morning Batch --> M9["Schedule Morning Clearing<br/>(09:00 AM IST / 03:30 UTC)"]
    M8 -- Evening Batch --> M10["Schedule Evening Clearing<br/>(17:00 PM IST / 11:30 UTC)"]
    
    M9 --> M11["Prevent Bank Bounce Penalty<br/>(Saves ₹250–₹500 Fee)"]
    M10 --> M11
```

---

## Hinglish Voice Recovery & Promise-to-Pay Tracker

### 1. Hinglish Voice Recovery / AI-Generated Voice Intervention (Sarvam AI Integration)
- **Sarvam AI Text-to-Speech Engine**: Sarvam AI generates personalized Hinglish voice recovery messages (`bulbul:v3`, speaker: `priya`, `target_language_code="hi-IN"`).
- **Environment & MOCK/REAL Mode**: Reads `SARVAM_API_KEY` from `.env`. When configured, executes live audio synthesis (`mode: "REAL"`). When omitted, runs in **MOCK/DEMO mode** (`mode: "MOCK"`) with Web Speech browser audio playback fallback.
- **Payload Status & Audit Trail**: Logs `VOICE_SCRIPT_GENERATED` (Groq/template script) and `VOICE_AUDIO_GENERATED` (base64 WAV payload synthesized and ready for PSTN/IVR telephony dispatch layers like Exotel/Twilio/Vapi).
- **Safety Policy Enforcement**: Voice intervention synthesis is governed by the deterministic safety policy engine. Prohibited on `BLOCKED` or `AMBIGUOUS` cases to prevent misleading or unsafe communications.
- **API Endpoint**: `POST /api/v1/cases/{case_id}/voice-call`

```mermaid
graph TD
    V1["Trigger Voice Recovery Request<br/>(POST /cases/{case_id}/voice-call)"] --> V2{"Evaluate Safety Policy"}
    V2 -- BLOCKED / AMBIGUOUS --> V3["Abort Voice Synthesis<br/>(Unsafe Communication Blocked)"]
    V2 -- Policy Approved --> V4["Generate Hinglish Script<br/>(Groq LLM / Template)"]
    
    V4 --> V5{"Check API Mode (SARVAM_API_KEY)"}
    V5 -- REAL Mode --> V6["Synthesize Speech via Sarvam AI<br/>(bulbul:v3 / priya / hi-IN)"]
    V5 -- MOCK Mode --> V7["Generate Web Speech Audio Payload<br/>(Demo Audio Fallback)"]
    
    V6 --> V8["Package Audio WAV Payload & Write Audit Trail"]
    V7 --> V8
    V8 --> V9["Dispatch to Telephony Provider<br/>(Exotel / Twilio / IVR Pipeline)"]
```

### 2. Promise-to-Pay (P2P) Tracker
- **P2P Lifecycle**: Full commitment tracking state machine: `PROMISED` ➔ `P2P_KEPT` or `P2P_BROKEN`.
- **Authoritative Settlement Verification**: P2P commitments are verified against the system's authoritative verified settlement state. A promise is marked as `P2P_KEPT` only upon confirmed deposit. Unverified retries do not count.
- **API Endpoints (Full Commitment Management)**:
  - `POST /api/v1/cases/{case_id}/p2p`: Record customer commitment date, amount & notes.
  - `GET /api/v1/cases/{case_id}/p2p`: Retrieve case P2P commitment history.
  - `PUT /api/v1/cases/{case_id}/p2p/{promise_id}`: Edit / update commitment date, amount & notes.
  - `DELETE /api/v1/cases/{case_id}/p2p`: Remove / cancel active commitment.
  - `POST /api/v1/cases/{case_id}/p2p/verify`: Reconcile P2P state against system settlement state.

```mermaid
graph TD
    P1["Customer Agrees to Pay Date"] --> P2["Record Commitment<br/>(Status: PROMISED)"]
    P2 --> P3["Monitor Commitment Target Date & Amount"]
    P3 --> P4["Settlement Reconciliation Engine<br/>(POST /p2p/verify)"]
    
    P4 --> P5{"Verify Against Bank Gateway Settlement"}
    P5 -- Deposit Confirmed --> P6["Status: P2P_KEPT<br/>(Successful Recovery)"]
    P5 -- Deposit Unconfirmed / Failed --> P7["Status: P2P_BROKEN<br/>(Trigger Strategy Re-evaluation)"]
    
    P6 --> P8["Record Audit Log Entry"]
    P7 --> P8
```

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.17+`
- **Python**: `3.12+`

### 2. Backend Setup (FastAPI + LangGraph)

#### Option A: Fast Setup with `uv` (Recommended)
```bash
cd backend

# 1. Create virtual environment
uv venv

# 2. Activate virtual environment
.venv\Scripts\activate      # Windows (PowerShell)
# source .venv/bin/activate # Linux/macOS

# 3. Install dependencies & copy env
uv pip install -r requirements.txt
cp .env.example .env

# 4. Run FastAPI Server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Option B: Standard `pip` Setup
```bash
cd backend

# 1. Create & activate virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows (PowerShell)
# source .venv/bin/activate # Linux/macOS

# 2. Install dependencies & copy env
pip install -r requirements.txt
cp .env.example .env

# 3. Run FastAPI Server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup (Next.js App Router)

```bash
cd frontend
npm install
npm run dev
```

- **Frontend App**: `http://localhost:3000`
