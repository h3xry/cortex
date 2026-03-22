# Spec-Driven Workflow

Based on [GitHub Spec-Kit](https://github.com/github/spec-kit) with custom quality gates.

## Flow
```
sss → ccc → ppp → ttt → [aaa] → [checklist] → implement → qqq → commit → rrr
 │     │     │     │       │         │              │        │       │
 │     │     │     │       │         │              │        │       └── Retrospective (mandatory)
 │     │     │     │       │         │              │        └────────── Our quality gate
 │     │     │     │       │         │              └─────────────────── Spec-Kit: implement
 │     │     │     │       │         └────────────────────────────────── Spec-Kit: checklist (optional)
 │     │     │     │       └──────────────────────────────────────────── Spec-Kit: analyze (optional)
 │     │     │     └──────────────────────────────────────────────────── Spec-Kit: tasks
 │     │     └────────────────────────────────────────────────────────── Spec-Kit: plan (+ research/contracts)
 │     └──────────────────────────────────────────────────────────────── Spec-Kit: clarify
 └────────────────────────────────────────────────────────────────────── Spec-Kit: specify
```

## Quick Codes

| Code | Command | Purpose |
|------|---------|---------|
| `sss` | `/specify` | Define What/Why (requirements) |
| `ccc` | `/clarify` | Resolve ambiguities (max 5 Qs) |
| `ppp` | `/plan` | Technical design + research + contracts |
| `ttt` | `/tasks` | User-story-based task breakdown |
| `aaa` | `/analyze` | Cross-artifact consistency (optional) |
| - | `/checklist` | Requirements quality validation (optional) |
| `gogogo` | `/implement` | Structured execution by phase |
| `qqq` | `/qqq` | Quality gate (4 reviewers) |
| `rrr` | `/rrr` | Retrospective (mandatory after commit) |

## Pre-checks

| Step | Requires |
|------|----------|
| `sss` | Feature description from user |
| `ccc` | `spec.md` exists |
| `ppp` | Ambiguities resolved |
| `ttt` | `plan.md` approved |
| `aaa` | `tasks.md` exists (optional step) |
| `/checklist` | `spec.md` exists (optional step) |
| `gogogo` | `tasks.md` exists |
| `qqq` | Code changes complete |
| `commit` | qqq PASS + full test suite + user permission |
| `rrr` | commit completed |

## Directory Structure

```
project/
├── CLAUDE.md                    # Main config (root)
└── .claude/                     # All AI files
    ├── memory/
    │   ├── constitution.md      # Governing principles
    │   ├── retrospective/       # rrr output
    │   ├── lesson/              # Lessons learned
    │   └── qqq/                 # Quality gate reports
    ├── specs/
    │   └── ###-feature-name/
    │       ├── spec.md          # What/Why (sss)
    │       ├── plan.md          # How (ppp)
    │       ├── research.md      # Decision log (ppp Phase 0)
    │       ├── data-model.md    # Entities (ppp Phase 1)
    │       ├── contracts/       # Interface specs (ppp Phase 1)
    │       ├── quickstart.md    # Validation scenarios (ppp Phase 1)
    │       ├── tasks.md         # Breakdown (ttt)
    │       └── checklists/      # Requirements validation
    │           ├── ux.md
    │           ├── api.md
    │           └── security.md
    ├── commands/                # Slash commands
    ├── rules/                   # Workflow rules
    └── agents/                  # Subagents (qqq)
```

## Plan Phases (ppp)

| Phase | Output | Purpose |
|-------|--------|---------|
| Phase 0 | research.md | Resolve unknowns, evaluate alternatives |
| Phase 1 | data-model.md, contracts/, quickstart.md | Design & contracts |

## Task Organization (ttt)

Tasks organized by user story for independent implementation:

```
Phase 1: Setup (shared infrastructure)
Phase 2: Foundation (BLOCKS all stories)
Phase 3: User Story 1 (P1) ← MVP
Phase 4: User Story 2 (P2)
Phase N: Polish & cross-cutting
```

Task format: `- [ ] T001 [P] [US1] Description with file path`

## Quality Gate (qqq)

Runs 5 subagents in parallel:
- security-reviewer: No BLOCKER/HIGH issues (OWASP Top 10)
- code-reviewer: No BLOCKER/HIGH issues (SonarQube Clean Code)
- test-reviewer: Coverage >= 80%
- consistency-checker: No critical deviations from codebase conventions
- dep-audit: No BLOCKER/HIGH CVEs in dependencies

## Before Commit (CRITICAL)

```bash
# ALWAYS run full test suite before commit
go test ./...      # Go
npm test           # Node
pytest             # Python
```

Package-level qqq catches depth issues.
Full test suite catches integration breaks.

## Constitution

One-time setup: `.claude/memory/constitution.md`
- Project principles
- Quality standards
- Workflow governance
- Amendment procedure

Review constitution before starting new features.
