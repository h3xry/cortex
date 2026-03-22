# /checklist - Requirements Quality Validation

Generate "Unit Tests for English" - validate requirements quality, not implementation.
Based on [GitHub Spec-Kit](https://github.com/github/spec-kit).

## Core Concept

Checklists test whether REQUIREMENTS are well-written, complete, and unambiguous.
They do NOT test whether implementation works.

| Wrong (tests implementation) | Right (tests requirements) |
|------------------------------|---------------------------|
| "Verify button clicks correctly" | "Are click behavior requirements defined?" |
| "Test error handling works" | "Are error handling requirements specified?" |
| "Confirm API returns 200" | "Are API response formats documented?" |

## Input
Checklist domain: $ARGUMENTS (e.g., "ux", "api", "security", "performance")

## Workflow

### 1. Load Context
- Read `.claude/specs/[feature]/spec.md`
- Read `.claude/specs/[feature]/plan.md` (if exists)
- Read `.claude/specs/[feature]/tasks.md` (if exists)

### 2. Clarify Intent (Max 3 Questions)

Generate contextual questions based on user's request:
- Scope refinement
- Risk prioritization
- Depth calibration (lightweight vs formal gate)
- Audience (author vs PR reviewer)

### 3. Generate Checklist

Write to `.claude/specs/[feature]/checklists/[domain].md`:

```markdown
# [Domain] Checklist: [Feature Name]

**Purpose:** [What this checklist validates]
**Created:** [Date]
**Feature:** [Link to spec.md]

## Requirement Completeness
- [ ] CHK001 Are [requirement type] defined for [scenario]? [Completeness]
- [ ] CHK002 Are all necessary requirements present for [area]? [Gap]

## Requirement Clarity
- [ ] CHK003 Is '[vague term]' quantified with specific criteria? [Clarity, Spec FR-001]
- [ ] CHK004 Are requirements unambiguous for [aspect]? [Ambiguity]

## Requirement Consistency
- [ ] CHK005 Do requirements align between [section A] and [section B]? [Consistency]
- [ ] CHK006 Are [component] requirements consistent across pages? [Consistency]

## Acceptance Criteria Quality
- [ ] CHK007 Can [requirement] be objectively measured? [Measurability, Spec SC-001]
- [ ] CHK008 Are success criteria technology-agnostic? [Acceptance Criteria]

## Scenario Coverage
- [ ] CHK009 Are [edge cases/scenarios] addressed in requirements? [Coverage]
- [ ] CHK010 Are error/recovery flow requirements defined? [Gap]

## Notes
- Items reference spec sections: [Spec FR-001], [Spec SC-001]
- [Gap] = missing requirement, [Ambiguity] = unclear requirement
```

### 4. Quality Dimensions

| Dimension | What to Check |
|-----------|--------------|
| Completeness | Are all necessary requirements documented? |
| Clarity | Are requirements specific and unambiguous? |
| Consistency | Do requirements align without conflicts? |
| Measurability | Can requirements be objectively verified? |
| Coverage | Are all scenarios/flows addressed? |
| Edge Cases | Are boundary conditions defined? |
| NFR | Performance, security, accessibility specified? |
| Dependencies | Are they documented and validated? |

### 5. Item Rules

**Required patterns:**
- "Are [requirement type] defined/specified for [scenario]?"
- "Is [vague term] quantified with specific criteria?"
- "Are requirements consistent between [A] and [B]?"
- "Can [requirement] be objectively measured?"
- "Does the spec define [missing aspect]?"

**Prohibited patterns:**
- "Verify", "Test", "Confirm" + implementation behavior
- References to code execution or user actions
- "Displays correctly", "works properly"
- Implementation details (frameworks, APIs)

**Traceability:** >=80% of items must reference spec section or use markers: [Gap], [Ambiguity], [Conflict], [Assumption]

### 6. File Handling

- If file doesn't exist → create, start at CHK001
- If file exists → append, continue from last CHK ID
- Never delete existing checklist content
- Soft cap: 40 items per checklist

### 7. Output

Report:
- Checklist path
- Item count
- Created new / appended to existing
- Focus areas and depth level

## Common Checklist Types

| Type | File | Focus |
|------|------|-------|
| UX | ux.md | Visual hierarchy, interactions, accessibility |
| API | api.md | Error formats, rate limiting, versioning |
| Security | security.md | Auth, data protection, threat model |
| Performance | performance.md | Metrics, load conditions, degradation |

## Rules
- Test REQUIREMENTS quality, not implementation
- Always reference spec sections
- Max 40 items (merge near-duplicates)
- Append to existing checklists, never overwrite
- Group by quality dimension
