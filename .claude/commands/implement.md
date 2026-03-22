# /implement (gogogo) - Structured Implementation

Execute all tasks from tasks.md following the implementation plan.
Based on [GitHub Spec-Kit](https://github.com/github/spec-kit).

## Prerequisites
- `.claude/specs/[feature]/tasks.md` exists
- `.claude/specs/[feature]/plan.md` exists

## Input
Feature to implement: $ARGUMENTS

## Workflow

### 1. Check Checklists (If Exist)

If `.claude/specs/[feature]/checklists/` exists:

| Checklist | Total | Completed | Incomplete | Status |
|-----------|-------|-----------|------------|--------|
| ux.md | 12 | 12 | 0 | PASS |
| security.md | 8 | 5 | 3 | FAIL |

If any incomplete → ask user: "Some checklists incomplete. Proceed anyway? (yes/no)"

### 2. Load Implementation Context

- **Required:** tasks.md, plan.md
- **If exists:** data-model.md, contracts/, research.md, quickstart.md

### 3. Project Setup

Verify/create ignore files based on tech stack:

| Tech | Files |
|------|-------|
| Go | .gitignore (vendor/, *.exe, *.test) |
| Node.js | .gitignore (node_modules/, dist/, .env*) |
| Python | .gitignore (__pycache__/, .venv/, *.pyc) |
| Docker | .dockerignore |
| Universal | .DS_Store, .idea/, *.tmp, *.swp |

### 4. Parse & Execute Tasks

Extract from tasks.md:
- Task phases (Setup → Foundation → User Stories → Polish)
- Dependencies (sequential vs parallel [P])
- Task details (ID, description, file paths)

**Execution rules:**
- Phase-by-phase (complete each before next)
- Respect dependencies ([P] tasks can run together)
- TDD approach: tests before implementation (if requested)
- Same-file tasks run sequentially

### 5. Implementation Order

```
Phase 1: Setup
  → Project structure, dependencies, config
Phase 2: Foundation (BLOCKS all stories)
  → Base models, shared infrastructure
Phase 3+: User Stories (by priority)
  → Per story: Tests → Models → Services → Handlers
Phase N: Polish
  → Docs, cleanup, security hardening
```

### 6. Progress Tracking

After each completed task:
- Mark as `[X]` in tasks.md
- Report progress
- If task fails:
  - Sequential task → halt and report
  - Parallel task [P] → continue others, report failure

### 7. Completion Validation

- [ ] All required tasks completed
- [ ] Implementation matches specification
- [ ] Tests pass (if written)
- [ ] Coverage meets requirements
- [ ] File structure matches plan

### 8. Output

```markdown
## Implementation Complete

Tasks completed: [N/Total]
Phases completed: [N]

| Phase | Status | Tasks |
|-------|--------|-------|
| Setup | Done | T001-T003 |
| Foundation | Done | T004-T006 |
| US1 | Done | T007-T011 |
| ... | ... | ... |

Failed tasks: [list or "None"]

Ready for: /qqq (quality gate)
```

## Rules
- Follow tasks.md order strictly
- Mark tasks [X] as completed in tasks.md
- Halt on sequential task failure
- Report parallel task failures but continue
- No shortcuts - complete each task fully
- Run full test suite after all phases
- Do NOT commit (wait for qqq + user permission)
