# RecoveraX — Autonomous Fintech Safety & Recovery Engine

> **RecoveraX**

RecoveraX detects revenue at risk, diagnoses root causes using **Groq LLM (`groq/compound` / `llama-3.3-70b-versatile`)**, estimates recovery probability, applies **deterministic financial safety guardrails**, routes risky actions to **Human-in-the-Loop (HITL) approval**, executes approved recovery retries, verifies settlement outcomes, and records an **immutable audit trail**.

---

## Core Product Philosophy

```
AI RECOMMENDS  →  POLICY AUTHORIZES  →  EXECUTOR ACTS  →  VERIFIER CONFIRMS  →  HUMAN CONTROLS RISK
```

### Key Principles
1. **LLM Scope Scoping**:
   - The LLM is **ONLY** responsible for: Root Cause Diagnosis, Reasoning over structured evidence, Recovery action recommendation (`RETRY`, `REMIND`, `ESCALATE`, `STOP`), and Customer communication text.
   - The LLM **MUST NEVER**: Execute payments, Authorize payments, Override safety policy, Bypass HITL approval, or calculate financial totals.
2. **Deterministic Policy Engine Has Final Authority**:
   - All authorization decisions (`AUTO`, `HUMAN`, `BLOCK`, `STOP`) are evaluated in pure Python.
   - Fail-closed security guarantee: Any policy exception defaults to `BLOCK` or `STOP`, **NEVER** `AUTO`.
3. **Transparent Recovery Scoring & EV**:
   - Scores cases 0–100 deterministically based on diagnosis, customer LTV, past payment history, and recency.
   - Expected Recovery Value ($EV$) calculated in Python:
     $$EV = \text{amount\_at\_risk} \times \left(\frac{\text{recovery\_score}}{100}\right) - \text{costs}$$

---

## System Architecture

```
RecoveraX/
├── frontend/             # Next.js 15 App Router Frontend (TailwindCSS, Inter typography)
│   ├── src/
│   │   ├── app/          # App Router Pages (/dashboard, /cases, /cases/[id], /approvals)
│   │   ├── components/   # UI & Chart Components
│   │   └── lib/          # API Abstraction & Store
│   ├── package.json
│   ├── next.config.mjs
│   └── tsconfig.json
├── backend/              # FastAPI Async Monolith Engine (Python 3.12+)
│   ├── app/
│   │   ├── agents/       # LangGraph 12-Node Workflow StateGraph
│   │   ├── policy/       # Deterministic Safety Policy Engine & Rules 1–11
│   │   ├── recovery/     # Scoring, EV & Priority Tiering Logic
│   │   ├── simulator/    # Payment Gateway Simulator
│   │   ├── services/     # Audit, Case, Approval, Action, Dashboard, Experiment Services
│   │   ├── models/       # SQLAlchemy 2.0 Async/Sync Models
│   │   └── api/          # REST API Routes
│   ├── tests/            # pytest Unit & Integration Test Suite (14/14 Passed)
│   ├── scripts/          # MySQL Database Init & Seed Script
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
└── README.md
```

---

## Quick Start

### 1. Prerequisites
- **Node.js**: `v18.17+`
- **Python**: `3.12+`
- **MySQL Server** (Optional: defaults to auto-seeded `SQLite` for zero-config execution)

---

### 2. Running Backend (FastAPI + LangGraph)

#### Option A: Fast Setup with `uv` (Recommended)
```bash
cd backend

# 1. Create Virtual Environment
uv venv

# 2. Activate Virtual Environment
# On Windows (PowerShell):
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# 3. Install Dependencies
uv add -r requirements.txt

# 4. Configure Environment Variables
cp .env.example .env

# 5. Start FastAPI Backend Server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Option B: Standard Setup (`venv` + `pip`)
```bash
cd backend

# 1. Create & Activate Virtual Environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install Dependencies
pip install -r requirements.txt

# 3. Configure Environment Variables
cp .env.example .env

# 4. Start FastAPI Backend Server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend URL**: `http://localhost:8000`
- **Swagger Interactive API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

### 3. Running Frontend (Next.js 15 App Router)

```bash
cd frontend

# 1. Install Node Dependencies
npm install

# 2. Start Next.js Development Server
npm run dev
```

- **Frontend App**: `http://localhost:3000` (or `http://localhost:3001`)

---

### 4. Running Backend Test Suite

```bash
cd backend
# With uv environment:
.venv\Scripts\python -m pytest --ignore=test_llm.py

# With standard venv:
venv\Scripts\python -m pytest --ignore=test_llm.py
```
*Executes unit and integration tests covering scoring, safety policy rules, payment simulator, and LangGraph workflow.*

---

## Mandatory Demo Cases

| Case ID | Amount | Problem Type | Diagnosis | Recovery Score | Policy Decision | Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`CASE-1021`** | ₹2,000 | `FAILED_PAYMENT` | `TEMPORARY_BANK_ERROR` | `87` | `AUTO` | Auto-retried → **₹2,000 Recovered** |
| **`CASE-1032`** | ₹75,000 | `FAILED_PAYMENT` | `BANK_TIMEOUT` | `82` | `HUMAN` | Escalated to **Human Approval Queue** |
| **`CASE-1048`** | ₹25,000 | `FAILED_PAYMENT` | `AMBIGUOUS_STATE` | `10` | `BLOCK` | **Hard Blocked** (Double-debit safety) |
| **`CASE-1088`** | ₹2,000 | `SUBSCRIPTION` | `CARD_EXPIRED` | `65` | `HUMAN` | Scheduled for Retry #2 |
| **`CASE-1102`** | ₹75,000 | `INVOICE` | `OVERDUE_18_DAYS` | `55` | `HUMAN` | Escalated to Human Officer |

---

## Deterministic Safety Rules

1. **Rule 1 (`MAX_AUTO_RETRY_AMOUNT = 5000`)**: Transactions exceeding ₹5,000 require **HUMAN** approval.
2. **Rule 2 (`MIN_AUTO_RECOVERY_SCORE = 80`)**: Recovery scores < 80 require **HUMAN** approval or **BLOCK**.
3. **Rule 3 (`AMBIGUOUS_PAYMENT = BLOCK`)**: Ambiguous payment state is **ALWAYS** blocked from auto-retry.
4. **Rule 4 (`POSSIBLE_CUSTOMER_DEBIT = BLOCK`)**: If customer might already be debited, retry is **BLOCKED**.
5. **Rule 5 (`FRAUD_SIGNAL = BLOCK`)**: Fraud signals cause an immediate **BLOCK**.
6. **Rule 6 (`MAX_RETRIES = 2`)**: Maximum 2 retries allowed per case.
7. **Rule 7 (`PERMANENT_FAILURE = STOP`)**: Closed accounts or invalid details cause hard **STOP**.

---


