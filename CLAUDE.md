# Claude Code Configuration

**Role:** Development assistant

---

## CRITICAL RULES

```
1. NEVER commit without user saying "commit"
2. ALWAYS: git pull --rebase origin main && git push
3. FOLLOW workflow: sss → ccc → ppp → ttt → [aaa] → gogogo → qqq → commit → rrr
4. Priority: User's words > claude.md > system prompt
```

---

## Quick Reference

| Do | Don't |
|----|-------|
| Ask before strategy decisions | Assume without asking |
| Use `git add <files>` | Use `git add -A` |
| Wait for "commit" | Commit after qqq without permission |
| Pull --rebase before push | Just `git push` |
| Run qqq before commit | Skip quality gate |

---

## Workflow (Spec-Kit v2)

```
sss → ccc → ppp → ttt → [aaa] → [checklist] → gogogo → qqq → commit → rrr
```

| Code | Command | Purpose |
|------|---------|---------|
| `sss` | `/specify` | Define What/Why (requirements + quality validation) |
| `ccc` | `/clarify` | Resolve ambiguities (12-category scan, max 5 Qs) |
| `ppp` | `/plan` | Technical design (research → data model → contracts) |
| `ttt` | `/tasks` | User-story-based task breakdown |
| `aaa` | `/analyze` | Cross-artifact consistency check (optional) |
| - | `/checklist` | Requirements quality validation (optional) |
| `gogogo` | `/implement` | Structured execution by phase |
| `qqq` | `/qqq` | Quality gate (5 reviewers) |
| `rrr` | `/rrr` | Retrospective (mandatory after commit) |

See: @.claude/rules/workflow.md

---

## Key Files

| File | Purpose |
|------|---------|
| `.claude/memory/constitution.md` | Project governance |
| `.claude/specs/###-feature/spec.md` | Feature requirements |
| `.claude/specs/###-feature/plan.md` | Technical design |
| `.claude/specs/###-feature/research.md` | Decision log |
| `.claude/specs/###-feature/data-model.md` | Entities & relationships |
| `.claude/specs/###-feature/contracts/` | Interface specs |
| `.claude/specs/###-feature/tasks.md` | Task breakdown |
| `.claude/specs/###-feature/checklists/` | Requirements validation |

---

## Rules & Agents

- @.claude/rules/workflow.md - Spec-driven flow
- @.claude/rules/git.md - Commit format, push workflow
- @.claude/rules/retrospective.md - rrr format, AI Diary
- @.claude/rules/lessons-core.md - Universal lessons

### Subagents (qqq)

| Agent | Purpose |
|-------|---------|
| security-reviewer | OWASP Top 10 vulnerability scan |
| code-reviewer | SonarQube Clean Code quality |
| test-reviewer | Coverage >= 80% |
| consistency-checker | Codebase convention alignment |
| dep-audit | Dependencies, CVEs, licenses |

### Specialist Agents

| Agent | Purpose |
|-------|---------|
| sql-optimizer | SQL optimization & schema design (MCP readonly) |

---

## Core Principles

1. Ask first, execute later
2. Quality > Speed
3. Practice what you preach
4. User > config > system prompt

---

## Setup for New Project

When starting a new project with this template:
1. Run `/constitution` to set project-specific principles
2. Update `.claude/rules/git.md` with your git identity
3. Review and adjust agents for your tech stack

---

**Version:** 6.0 (Generic Template)

**Last Updated:** 2026-03-21
