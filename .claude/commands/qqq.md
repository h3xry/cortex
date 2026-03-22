# /qqq - Quality Gate

Run 5 parallel reviewers and consolidate results before commit.

## Pre-checks

- [ ] Code changes exist (`git diff --cached` or `git diff HEAD`)
- [ ] Tasks completed (from `.claude/specs/[feature]/tasks.md`)
- [ ] Tests written and passing locally

## Workflow

### 1. Verify Changes Exist
```bash
git diff --cached --name-only
# OR
git diff HEAD --name-only
```

If no changes → STOP with message "No changes to review"

### 2. Run 5 Reviewers in Parallel

Launch simultaneously using Agent tool:

| Agent | Focus | Pass Criteria |
|-------|-------|---------------|
| security-reviewer | Vulnerabilities, OWASP Top 10 | No BLOCKER/HIGH issues |
| code-reviewer | Quality, SonarQube Clean Code | No BLOCKER/HIGH issues |
| test-reviewer | Coverage, test quality | Coverage >= 80% |
| consistency-checker | Codebase convention alignment | No critical deviations |
| dep-audit | Dependencies, CVEs, licenses | No BLOCKER/HIGH vulnerabilities |

### 3. Collect Results

Wait for all 5 agents to complete.

### 4. Consolidate Report

```markdown
# Quality Gate Report

**Feature:** [feature name]
**Date:** [date]
**Files Changed:** [count]

## Security Review
**Status:** PASS / FAIL
**Issues:** [count by severity]
- BLOCKER: X
- HIGH: X
- MEDIUM: X
- LOW: X

[Details if any issues]

## Code Review
**Status:** PASS / FAIL
**Issues:** [count by severity]
- BLOCKER: X
- HIGH: X
- MEDIUM: X
- LOW: X

Quality impact: Reliability [OK/ISSUES] | Security [OK/ISSUES] | Maintainability [OK/ISSUES]

[Details if any issues]

## Test Review
**Status:** PASS / FAIL
**Coverage:** XX%

[Details if below 80%]

## Consistency Check
**Status:** CONSISTENT / HAS DEVIATIONS
**Deviations:** [count by severity]
- Critical: X
- Notable: X
- Minor: X

[Details if any deviations]

## Dependency Audit
**Status:** PASS / WARN / FAIL
**Vulnerabilities:** Critical: X, High: X, Medium: X, Low: X
**Outdated:** X packages
**Unused:** X packages
**License issues:** X packages

[Details if any issues]

---

## Gate Decision

| Reviewer | Status |
|----------|--------|
| Security | ✅ / ❌ |
| Code | ✅ / ❌ |
| Test | ✅ / ❌ |
| Consistency | ✅ / ⚠️ / ❌ |
| Dependencies | ✅ / ⚠️ / ❌ |

### Result: **PASS** / **WARN** / **FAIL**

[If FAIL: list what needs to be fixed]
[If WARN: list issues for user to decide]
```

### 5. Save Report

Save to: `.claude/memory/qqq/YYYY-MM-DD-HHMM-[feature].md`

## Gate Criteria

### PASS Requirements (ALL must be true)
- [ ] Security: No BLOCKER or HIGH issues
- [ ] Code: No BLOCKER or HIGH issues
- [ ] Test: Coverage >= 80%
- [ ] Consistency: No critical deviations
- [ ] Dependencies: No BLOCKER or HIGH vulnerabilities
- [ ] All tests passing

### WARN Conditions (user decides)
- [ ] Consistency: Notable deviations exist but no critical ones
- [ ] Code: MEDIUM issues only
- [ ] Dependencies: Medium CVEs or outdated major versions

### Auto-FAIL Conditions (ANY triggers FAIL)
- [ ] Hardcoded secrets detected
- [ ] SQL injection vulnerability
- [ ] Critical security flaw
- [ ] Test coverage < 50%
- [ ] Failing tests
- [ ] Critical consistency deviation (breaks architecture)
- [ ] Critical CVE with known exploit in dependencies

## Post-qqq Checklist

Before requesting commit:

- [ ] qqq status: PASS (or WARN with user approval)
- [ ] Full test suite passed (`go test ./...`)
- [ ] No uncommitted changes outside scope
- [ ] Commit message drafted

## Output

After qqq completes, report:

```
## qqq Summary

Result: PASS ✅ / WARN ⚠️ / FAIL ❌

Security: [status] ([issue count])
Code: [status] ([issue count])
Test: [coverage]%
Consistency: [status] ([deviation count])
Dependencies: [status] ([vulnerability count])

[If PASS]
Ready for commit. Waiting for user to say "commit".

[If WARN]
Issues for review:
1. [issue]
Proceed with commit? Waiting for user decision.

[If FAIL]
Issues to fix:
1. [issue]
2. [issue]
```

## Rules

- Never skip any reviewer
- All 5 must complete before decision
- FAIL requires fix and re-run qqq
- WARN requires user approval to proceed
- PASS does NOT mean auto-commit (wait for user)
- Save report for audit trail
