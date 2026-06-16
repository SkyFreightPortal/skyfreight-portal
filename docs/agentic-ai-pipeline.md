# Agentic AI Pipeline — Architecture & Implementation Plan

**Document Purpose:** Proposal for a multi-agent AI system that automates the software
development lifecycle from requirements through deployment, with human approval gates at
critical checkpoints.

**Date:** June 2026

---

## 1. Executive Summary

This document proposes an Agentic AI pipeline that automates six stages of software
development: Requirements, Solution Design, Solution Review, Development, QA, and
Deployment. Each stage is handled by a specialised AI agent with a defined set of tools
and a clear input/output contract. Humans remain in control at four decision gates —
ensuring quality and safety without doing the repetitive heavy lifting.

The technology foundation is Anthropic's Claude models (Opus, Sonnet, Haiku) combined
with the Anthropic Agent SDK. The pattern is already proven in practice: the SkyFreight
Portal itself was built using exactly this kind of agent-assisted development workflow
across Steps 1–4.

---

## 2. Feasibility Assessment

### What Works Well Today

| Capability | Status |
|---|---|
| Structured requirements generation | Production-ready |
| Architecture and API design | Production-ready |
| Code generation with compile validation | Production-ready |
| Automated curl / HTTP smoke testing | Production-ready |
| Git operations (branch, commit, merge) | Production-ready |
| Docker build and health-check polling | Production-ready |
| Multi-agent coordination via Agent SDK | Production-ready |

### Where Human Oversight Is Still Needed

| Risk | Why It Matters | Mitigation |
|---|---|---|
| Requirements misinterpretation | LLMs fill ambiguity silently | Human sign-off gate after Requirements |
| Reviewer blind spots (same model family) | May confirm rather than critique | Adversarial system prompt + separate reviewer |
| QA coverage gaps (UX, exploratory) | Automated tests cannot replace human judgment | Human smoke test gate before deploy |
| Deployment is irreversible | A bad deploy can cause an outage | Hard human confirmation before push and restart |
| Cost on large codebases | Long multi-agent runs are expensive | Scope each agent's context window tightly |

### Verdict

**Fully feasible.** The recommended approach is a human-in-the-loop pipeline — agents
do the heavy lifting, but humans approve at four gates. Fully autonomous end-to-end
is technically possible but carries unacceptable blast radius without checkpoints.

---

## 3. Pipeline Overview

```
Human Feature Request
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                     ORCHESTRATOR                       │
│   Owns state machine, routes between agents, manages  │
│   human gates, retries, and failure handling          │
└────────┬──────────────────────────────────────────────┘
         │
         ▼
  [1] Requirements Agent
         │
         ▼
  ══ HUMAN GATE 1: Approve requirements spec ══
         │
         ▼
  [2] Solution Producer
         │
         ▼
  [3] Solution Reviewer ── (REVISE loop, max 2x) ──► back to [2]
         │ APPROVED
         ▼
  ══ HUMAN GATE 2: Approve design ══
         │
         ▼
  [4] Developer Agent
         │
         ▼
  [5] QA Agent ── (FAIL loop, max 3x) ──► back to [4]
         │ PASS
         ▼
  ══ HUMAN GATE 3: Smoke test approval ══
         │
         ▼
  [6] Deploy Agent
         │
         ▼
  ══ HUMAN GATE 4: Confirm push + restart ══
         │
         ▼
  Production Deployment
```

---

## 4. Agent Specifications

---

### 4.1 Orchestrator

The Orchestrator is the top-level coordinator. It does not write code or design
solutions — it manages state and keeps the pipeline moving.

**Responsibilities:**
- Maintains `pipeline_state.json` (current stage, outputs, gate decisions, retry count)
- Routes artifacts between agents
- Enforces human gates (blocks until approval flag is set)
- Retries failed agents up to 2 times; escalates to human on the 3rd failure
- Makes the pipeline resumable — if interrupted, it restarts from the last completed stage

**Model:** Claude Opus 4.8

**Tools:**

| Tool | Purpose |
|---|---|
| TaskCreate / TaskUpdate | Track progress of each stage |
| Write | Persist `pipeline_state.json` |
| PushNotification | Alert human when a gate is reached or an agent fails |

---

### 4.2 Requirements Agent

**Purpose:** Convert a free-form feature request into a precise, testable specification
that downstream agents can act on without guessing at intent.

**Input:** Natural-language description of the feature from the human.

**Output:** `requirements.md` — structured document containing:

```
## Feature: <title>

### User Stories
  As a <role>, I want <capability>, so that <benefit>.

### Acceptance Criteria
  AC-1. <specific, testable condition>
  AC-2. <specific, testable condition>

### Constraints
  - Technology stack limitations
  - Security requirements
  - Performance targets

### Out of Scope
  - Explicit list of what will NOT be built

### Open Questions
  - Ambiguities flagged for human to answer before proceeding
```

**Model:** Claude Sonnet 4.6 (fast, cost-effective for structured output)

**Tools:**

| Tool | Purpose |
|---|---|
| Read | Read CLAUDE.md and key existing files for codebase context |
| Glob / Grep | Discover related existing features to avoid duplication |
| WebSearch | Domain research if needed (regulations, external standards) |
| Write | Produce `requirements.md` |

**► HUMAN GATE 1**

The human reviews `requirements.md`, answers any Open Questions, and either approves
or returns it with comments. The pipeline does not advance until explicit approval.
This is the cheapest gate — catching a misunderstood requirement here saves hours
of developer and QA work later.

---

### 4.3 Solution Producer

**Purpose:** Read the approved requirements and the existing codebase, then produce a
complete design document specific enough that a Developer agent can implement it
without ambiguity.

**Input:** Approved `requirements.md` + full codebase read access.

**Output:** `solution_design.md` — containing:

```
## Architecture Decision
  Summary of the approach chosen and why.

## Files to Create
  - path/to/NewFile.java — purpose, key exports

## Files to Modify
  - path/to/ExistingFile.tsx — what changes and why

## Database Migration
  - New tables / columns with exact DDL (column names, types, nullability)

## API Contracts
  - POST /orders — request body shape, response shape, auth roles

## Frontend Component Breakdown
  - New pages, hooks, types, constants files

## Risks & Assumptions
  - What must be true for this design to work
```

**Model:** Claude Opus 4.8 (strongest architectural reasoning, handles long context)

**Tools:**

| Tool | Purpose |
|---|---|
| Read | Key existing files (entities, controllers, pages, configs) |
| Glob | Full file inventory to understand project structure |
| Grep | Find existing patterns to follow (naming, annotations, conventions) |
| WebSearch | Best practices for unfamiliar design patterns |
| Write | Produce `solution_design.md` |

---

### 4.4 Solution Reviewer

**Purpose:** Independent critic of the proposed design. Deliberately adversarial — its
job is to find problems, not validate the design. Uses a different system prompt to
counter the LLM's natural tendency toward agreement.

**System Prompt (key excerpt):**
> "Your job is to find problems with this design, not validate it. A design
> with no issues is a sign you missed something. Focus on: correctness, security,
> completeness against requirements, and breaking changes to existing features."

**Input:** `solution_design.md` + `requirements.md` + referenced existing files.

**Output:** `solution_review.md` — containing:

```
## Decision: APPROVED | REVISE

## Issues Found
  [BLOCKER] Missing FK cascade on orders table — orphan rows on user delete
  [WARNING]  No rate limiting on POST /orders endpoint
  [SUGGESTION] Extract ShipmentPartyFields into a shared component

## Checklist
  ✓ All acceptance criteria covered by the design?
  ✓ No breaking changes to existing APIs?
  ✓ Database migration is reversible?
  ✓ Auth/role checks correct on all endpoints?
  ✓ Frontend routes protected appropriately?
```

**If REVISE:** Orchestrator loops back to the Solution Producer with `solution_review.md`
attached. Maximum 2 loops before escalating to human.

**Model:** Claude Opus 4.8 — run at lower temperature (0.3) for more deterministic critique

**Tools:**

| Tool | Purpose |
|---|---|
| Read | Design doc + files it references |
| Grep | Verify referenced symbols actually exist in the codebase |
| Write | Produce `solution_review.md` |

**► HUMAN GATE 2**

The human sees `solution_design.md` and `solution_review.md` side by side. Approves
or adds directives. No code is written until this gate clears.

---

### 4.5 Developer Agent

**Purpose:** Implement the approved design precisely. Scope is locked to the file list
in `solution_design.md` — no additional refactoring, no extra features.

**Input:** Approved `solution_design.md` + codebase write access.

**Output:** Working code committed to a feature branch.

**Model:** Claude Sonnet 4.6 (fast, cost-effective for file I/O heavy work)

**Tools:**

| Tool | Purpose |
|---|---|
| Read | Files that need to be modified |
| Write | New files |
| Edit | Targeted edits to existing files |
| Glob / Grep | Verify patterns and symbol names before writing |
| Bash (compile) | `mvn compile` or `tsc --noEmit` after each file group |
| Bash (git) | `git checkout -b feature/<name>`, `git add`, `git commit` |

**Guardrails:**
- Compile check runs after every backend file group; frontend type-check after every
  frontend file group. Self-corrects before moving to the next file.
- Scope is strictly limited to files listed in `solution_design.md`. Any discovered
  ambiguity is flagged as a comment in the commit message, not silently resolved.
- Never runs `git push` — that is exclusively the Deploy agent's responsibility.

---

### 4.6 QA Agent

**Purpose:** Validate the implementation against the acceptance criteria from
`requirements.md`. The QA agent reads only `requirements.md` when deciding what to
test — not `solution_design.md`. This prevents it from merely verifying the design's
assumptions instead of the actual user requirements.

**Input:** `requirements.md` (acceptance criteria), feature branch code, running
backend and frontend.

**Output:** `qa_report.md` — containing:

```
## Result: PASS | FAIL

## Acceptance Criteria Coverage
  AC-1 ✓  Order created from ACCEPTED offer returns 200, orderNumber populated
  AC-2 ✓  Duplicate conversion attempt returns 400 with error message
  AC-3 ✗  FAIL: Status transition CONFIRMED → IN_TRANSIT returns 500 (see log)

## Test Commands Run
  curl -X POST /api/v1/orders ... → HTTP 200 ✓
  curl -X POST /api/v1/orders ... → HTTP 400 ✓  (duplicate)
  mvn test → 47 passed, 0 failed ✓

## Issues Found
  Issue 1: <description, repro steps, expected vs actual>
```

**Model:** Claude Sonnet 4.6

**Tools:**

| Tool | Purpose |
|---|---|
| Bash | Run test suite (mvn test, npm test), curl API walkthrough, health checks |
| Read | Acceptance criteria, existing test patterns |
| Write | New test files (if specified in design), `qa_report.md` |
| Grep | Find existing test conventions to follow |

**Loop:** If FAIL — Orchestrator sends `qa_report.md` plus the relevant code files
back to the Developer Agent. Maximum 3 loops before human escalation.

**► HUMAN GATE 3**

Human reviews `qa_report.md` and performs a manual smoke test — UI walkthrough,
edge cases that automated testing cannot cover. Approves the merge when satisfied.

---

### 4.7 Deploy Agent

**Purpose:** Merge the approved feature branch, build the production artifact, deploy,
and confirm the service is healthy. Deliberately narrow toolset — no file editing,
no code changes whatsoever.

**Input:** Approved feature branch name + deployment configuration.

**Output:** Running production deployment + `deploy_report.md` (commit SHA, image tag,
health check result, rollback instructions if needed).

**Model:** Claude Haiku 4.5 (simple, deterministic task — most cost-effective choice)

**Tools:**

| Tool | Purpose |
|---|---|
| Bash (git) | `git merge --no-ff feature/<name>`, `git push origin master` |
| Bash (docker) | `docker build`, `docker push`, `docker compose up -d --build` |
| Bash (health) | Poll `GET /actuator/health` until healthy or timeout (5 minutes) |
| Write | `deploy_report.md` |

**► HUMAN GATE 4**

Two separate confirmation prompts:
1. "Confirm push to origin/master?" — before `git push`
2. "Confirm service restart?" — before `docker compose up -d --build`

Both must be explicitly approved. If the health check fails after restart, the Deploy
agent alerts the human with rollback instructions but does NOT auto-rollback.

---

## 5. Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Agent framework | Anthropic Agent SDK | Native tool use, multi-agent routing |
| Orchestrator state | `pipeline_state.json` (file) or Redis | Resumable across interruptions |
| Human gate delivery | Slack webhook / Email / Push notification | Whichever the team already uses |
| Artifact storage | Local filesystem or S3 | Requirements, design, review, QA docs |
| Model: Orchestrator | Claude Opus 4.8 | Strongest reasoning for coordination |
| Model: Requirements | Claude Sonnet 4.6 | Fast structured output |
| Model: Solution Producer | Claude Opus 4.8 | Long-context architectural reasoning |
| Model: Solution Reviewer | Claude Opus 4.8 | Adversarial critique, low temperature |
| Model: Developer | Claude Sonnet 4.6 | Cost-effective, fast file I/O |
| Model: QA | Claude Sonnet 4.6 | Balanced capability and cost |
| Model: Deploy | Claude Haiku 4.5 | Simple deterministic steps, cheapest |

---

## 6. Key Design Principles

### Principle 1 — Artifacts are files, not memory
Every agent reads its input from a named file and writes its output to a named file.
Nothing lives only in an agent's context window. This makes the pipeline inspectable
(a human can read any artifact at any point), resumable (Orchestrator knows exactly
where to restart), and auditable.

### Principle 2 — Human gates are blocking with no timeout
The Orchestrator sends a notification and polls for an approval flag. It waits
indefinitely. No automatic approval after N minutes. This is intentional — a human
must actively decide to proceed.

### Principle 3 — The Reviewer is adversarial by design
The Solution Reviewer runs with a system prompt that starts: *"Your job is to find
problems, not confirm correctness."* Using the same model as the producer but with
an adversarial prompt is more reliable than using a weaker model, because the quality
of the critique must match the quality of the design being reviewed.

### Principle 4 — Developer scope is locked
The Developer agent is given a list of permitted files from `solution_design.md`. It
cannot edit files outside that list without an explicit Orchestrator override. This
prevents scope creep, protects unrelated parts of the codebase, and makes diffs
predictable for human review.

### Principle 5 — QA tests requirements, not implementation
The QA agent reads `requirements.md` to decide what to test — not `solution_design.md`.
If QA were allowed to read the design, it would naturally verify that the design was
implemented correctly rather than that the user's actual need was met. These are
different things.

### Principle 6 — Deploy agent has the narrowest toolset
The Deploy agent cannot read or write source files. It can only run shell commands
against git, docker, and health check endpoints. This is enforced at the tool
assignment level, not by instruction alone.

---

## 7. Phased Implementation Roadmap

Rather than building all six agents at once, the recommended approach is to introduce
them incrementally — each phase delivering standalone value.

### Phase 1 — Developer + QA (Weeks 1–3)
These two agents alone eliminate the majority of repetitive implementation work.
The Developer agent already mirrors what Claude Code does today; the QA agent adds
structured regression coverage. Human gates at start (design approval) and end
(smoke test) keep quality high.

**Deliverable:** Given an approved design document, automatically produce working
committed code and a QA report.

### Phase 2 — Add Solution Producer + Reviewer (Weeks 4–6)
Automate the design phase. The human still approves the final design before code
is written, but no longer has to produce it from scratch.

**Deliverable:** Given approved requirements, automatically produce a reviewed
design document ready for human sign-off.

### Phase 3 — Add Requirements Agent (Weeks 7–8)
Automate the first mile — turning a rough feature idea into a structured spec.
The human still approves the spec before anything else runs.

**Deliverable:** Full pipeline from feature idea through committed code and QA report.

### Phase 4 — Add Deploy Agent (Weeks 9–10)
Add the final stage. This is the highest-risk addition and should only be introduced
after Phases 1–3 have built confidence in the pipeline's reliability.

**Deliverable:** Full end-to-end pipeline from feature idea to production deployment.

---

## 8. Cost Estimate (per feature)

Estimates assume a medium-complexity feature (comparable to Step 4 — Order Management).

| Stage | Model | Est. Tokens | Est. Cost |
|---|---|---|---|
| Requirements | Sonnet 4.6 | ~20K | ~$0.06 |
| Solution Producer | Opus 4.8 | ~80K | ~$1.20 |
| Solution Reviewer | Opus 4.8 | ~60K | ~$0.90 |
| Developer | Sonnet 4.6 | ~200K | ~$0.60 |
| QA | Sonnet 4.6 | ~40K | ~$0.12 |
| Deploy | Haiku 4.5 | ~10K | ~$0.01 |
| **Total** | | **~410K** | **~$2.89** |

This replaces several hours of senior engineer time per feature. At typical consulting
rates the ROI is significant even for modest team sizes.

---

## 9. Summary

| Agent | Model | Human Gate After? |
|---|---|---|
| Orchestrator | Opus 4.8 | — (coordinator) |
| Requirements | Sonnet 4.6 | Yes — Gate 1 |
| Solution Producer | Opus 4.8 | — |
| Solution Reviewer | Opus 4.8 | Yes — Gate 2 |
| Developer | Sonnet 4.6 | — |
| QA | Sonnet 4.6 | Yes — Gate 3 |
| Deploy | Haiku 4.5 | Yes — Gate 4 (×2) |

The pipeline delivers maximum automation while keeping humans in control at every
decision that is hard to reverse. The result is faster delivery, consistent quality,
and a complete audit trail of every design decision and test result.

---

*Prepared by Claude Sonnet 4.6 (Anthropic) · SkyFreight Portal project · June 2026*
