# /analyze (aaa) - Cross-Artifact Consistency Check

Non-destructive analysis across spec.md, plan.md, and tasks.md.
Based on [GitHub Spec-Kit](https://github.com/github/spec-kit).

**STRICTLY READ-ONLY** - does not modify any files.

## Prerequisites
- `.claude/specs/[feature]/tasks.md` exists (run after `/tasks`)

## Input
Feature to analyze: $ARGUMENTS

## Workflow

### 1. Load Artifacts

From `.claude/specs/[feature]/`:

| File | Extract |
|------|---------|
| spec.md | Requirements, user stories, edge cases |
| plan.md | Architecture, stack, constraints |
| tasks.md | Task IDs, descriptions, phases, [P] markers |
| constitution.md | Principles, MUST/SHOULD rules |

Abort if any required file missing.

### 2. Build Semantic Models (Internal)

- **Requirements inventory:** Each FR/NFR with stable key
- **User story/action inventory:** Actions with acceptance criteria
- **Task coverage mapping:** Each task → requirements/stories
- **Constitution rule set:** MUST/SHOULD statements

### 3. Detection Passes (Max 50 Findings)

#### A. Duplication Detection
- Near-duplicate requirements
- Mark lower-quality phrasing for consolidation

#### B. Ambiguity Detection
- Vague adjectives (fast, scalable, robust) without metrics
- Unresolved placeholders (TODO, ???, `<placeholder>`)

#### C. Underspecification
- Requirements with verbs but missing measurable outcome
- User stories missing acceptance criteria
- Tasks referencing undefined components

#### D. Constitution Alignment
- Requirements conflicting with MUST principles → auto CRITICAL
- Missing mandated sections or quality gates

#### E. Coverage Gaps
- Requirements with zero associated tasks
- Tasks with no mapped requirement/story
- Non-functional requirements not in tasks

#### F. Inconsistency
- Terminology drift (same concept, different names)
- Data entities in plan but absent in spec (or vice versa)
- Task ordering contradictions
- Conflicting requirements

### 4. Severity Assignment

| Severity | Criteria |
|----------|----------|
| CRITICAL | Constitution violation, core requirement with zero coverage |
| HIGH | Duplicate/conflicting requirement, ambiguous security/perf |
| MEDIUM | Terminology drift, missing NFR coverage, underspecified edge case |
| LOW | Style/wording, minor redundancy |

### 5. Output Report

```markdown
## Specification Analysis Report

| ID | Category | Severity | Location | Summary | Recommendation |
|----|----------|----------|----------|---------|----------------|
| A1 | Duplication | HIGH | spec:L120 | ... | Merge phrasing |
| ... | ... | ... | ... | ... | ... |

## Coverage Summary
| Requirement | Has Task? | Task IDs | Notes |
|-------------|-----------|----------|-------|
| ... | ... | ... | ... |

## Constitution Alignment Issues
[List or "None found"]

## Unmapped Tasks
[Tasks with no requirement mapping]

## Metrics
- Total Requirements: [N]
- Total Tasks: [N]
- Coverage: [%]
- Ambiguity Count: [N]
- Duplication Count: [N]
- Critical Issues: [N]

## Next Actions
[Based on findings severity]
```

### 6. Recommendations

- CRITICAL issues → resolve before `/implement`
- LOW/MEDIUM only → may proceed with suggestions
- Offer: "Want concrete remediation edits for top N issues?"

## Rules
- NEVER modify files (read-only)
- NEVER hallucinate missing sections
- Prioritize constitution violations (always CRITICAL)
- Report zero issues gracefully with coverage stats
- Max 50 findings, summarize overflow
- Constitution conflicts require spec/plan adjustment, not constitution change
