# Project Constitution

**Project:** Tacking & Learning — Claude Code CLI Monitor (Web Frontend)
**Version:** 1.0.0
**Created:** 2026-03-23
**Last Updated:** 2026-03-23

---

## 1. Core Principles

### 1.1 Quality Over Speed
Code MUST be correct before fast. All changes MUST pass quality gate (qqq) with 5 reviewers before commit.
**Rationale:** Bugs in production cost more than slow development.

### 1.2 User First
User's explicit instruction MUST override all other rules. MUST ask before strategy decisions. MUST NOT assume when unclear.
**Rationale:** AI serves the user, not the other way around.

### 1.3 Simplicity
MUST start with minimal viable solution. MUST NOT over-engineer. MUST justify any abstraction beyond 3 layers (handler → service → repository).
**Rationale:** Complexity is the enemy of maintainability.

### 1.4 Spec-Driven Development
Every feature MUST follow the spec-kit workflow. MUST NOT skip steps without user permission. Specifications MUST be approved before implementation.
**Rationale:** Writing specs forces clear thinking before coding.

### 1.5 Codebase Consistency
New code MUST follow existing codebase conventions. Deviations MUST be justified. Convention changes MUST be applied project-wide, not per-file.
**Rationale:** Inconsistent code increases cognitive load and bugs.

---

## 2. Development Standards

### 2.1 Code Quality
- [ ] All public functions documented
- [ ] Error handling required (no silent failures)
- [ ] Errors wrapped with context
- [ ] No hardcoded secrets or credentials
- [ ] Cognitive complexity per function <= 15
- [ ] Code duplication <= 3%
- [ ] Issues classified per SonarQube Clean Code taxonomy

### 2.2 Testing Requirements
- [ ] Minimum 80% test coverage
- [ ] Unit tests for all business logic
- [ ] Integration tests for external APIs
- [ ] No `log.Fatal` / `os.Exit` in testable code
- [ ] Test-first approach (TDD) when requested

### 2.3 Security (OWASP Top 10)
- [ ] Input validation at boundaries
- [ ] No injection vulnerabilities (SQL, Command, XSS)
- [ ] No SSRF, insecure deserialization
- [ ] No mass assignment
- [ ] Secrets in environment variables only
- [ ] Rate limiting on auth endpoints

---

## 3. Workflow Governance

### 3.1 Required Flow
```
sss → ccc → ppp → ttt → [aaa] → [checklist] → gogogo → qqq → commit → rrr
```

### 3.2 Gate Requirements
| Gate | Requirement |
|------|-------------|
| sss → ccc | spec.md exists with prioritized user stories |
| ccc → ppp | Critical ambiguities resolved |
| ppp → ttt | plan.md approved with research complete |
| ttt → gogogo | tasks.md with user-story-based breakdown |
| gogogo → qqq | Implementation complete, tests passing |
| qqq → commit | All 5 reviewers PASS + full test suite |
| commit → rrr | Retrospective mandatory after every commit |

### 3.3 Quality Gate (qqq) - 5 Reviewers
| Reviewer | Pass Criteria |
|----------|---------------|
| security-reviewer | No BLOCKER/HIGH (OWASP Top 10) |
| code-reviewer | No BLOCKER/HIGH (SonarQube Clean Code) |
| test-reviewer | Coverage >= 80% |
| consistency-checker | No critical deviations |
| dep-audit | No BLOCKER/HIGH CVEs |

### 3.4 Skip Policy
- No step can be skipped without user permission
- Constitution violations MUST be justified in plan.md Complexity Tracking
- User can override any rule with explicit instruction

---

## 4. Git & Commits

### 4.1 Commit Identity (CRITICAL)
```
GIT_AUTHOR_NAME=h3xry
GIT_AUTHOR_EMAIL=h3xry@users.noreply.github.com
```
MUST set env vars on every commit. MUST NOT rely on git config alone.

### 4.2 Commit Format
```
type(scope): message
```
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

### 4.3 Prohibited Actions
- Force push to main
- Commit without user permission
- Push without pull --rebase
- AI signatures in commits
- `git add -A` (use specific paths)

---

## 5. Documentation

### 5.1 Spec Files
Location: `.claude/specs/[###-feature-name]/`

| File | Purpose | Created by |
|------|---------|-----------|
| spec.md | What/Why | /specify |
| plan.md | How (+ research, data-model, contracts) | /plan |
| tasks.md | Actionable breakdown | /tasks |
| checklists/ | Requirements validation | /checklist |

---

## 6. Amendment Procedure

1. Propose change with rationale
2. Review impact on existing specs, agents, rules
3. Update version (MAJOR.MINOR.PATCH)
4. Document in changelog
5. User MUST approve amendments

### Version Rules
- MAJOR: Breaking changes to principles or workflow
- MINOR: New principles, sections, or agents
- PATCH: Clarifications only

---

## Changelog

### v1.0.0 (2026-03-23)
- Initial constitution from generic template
- Spec-Kit v2 workflow
- Quality gate with 5 reviewers
