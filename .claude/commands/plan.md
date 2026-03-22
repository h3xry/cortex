# /plan (ppp) - Technical Planning

Create implementation plan focusing on HOW - technical approach and architecture.
Based on [GitHub Spec-Kit](https://github.com/github/spec-kit).

## Prerequisites
- `.claude/specs/[feature]/spec.md` exists
- Ambiguities resolved (via `/clarify`)

## Input
Feature to plan: $ARGUMENTS

## Workflow

### 1. Load Context
- Read `.claude/specs/[feature]/spec.md`
- Read `.claude/memory/constitution.md`
- Check for existing `plan.md`

### 2. Constitution Check (GATE)

Must pass before Phase 0. Re-check after Phase 1.

- [ ] Spec aligns with project principles
- [ ] No constitution violations identified
- [ ] Scope is appropriate

If violations found → STOP and report (unless justified in Complexity Tracking).

### 3. Create Plan

Write to `.claude/specs/[feature]/plan.md`:

```markdown
# Implementation Plan: [Feature Name]

**Spec:** [link to spec.md]
**Created:** [Date]
**Status:** Draft

## Summary
[Technical approach from research]

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | [e.g., Go 1.21] |
| Primary Dependencies | [e.g., Chi, GORM] |
| Storage | [e.g., PostgreSQL, N/A] |
| Testing | [e.g., go test + testify] |
| Target Platform | [e.g., REST API, CLI] |
| Project Type | [library/cli/web-service/mobile-app] |
| Performance Goals | [domain-specific or NEEDS CLARIFICATION] |
| Constraints | [domain-specific or NEEDS CLARIFICATION] |

## Constitution Check
[Gates from constitution file]

## Project Structure

### Documentation (this feature)
specs/[###-feature]/
├── plan.md          # This file
├── research.md      # Phase 0 output
├── data-model.md    # Phase 1 output
├── contracts/       # Phase 1 output
├── quickstart.md    # Phase 1 output
└── tasks.md         # /tasks command output

### Source Code
[Concrete layout based on project type]

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| ... | ... | ... |
```

### 4. Phase 0: Research

For each NEEDS CLARIFICATION or unknown in Technical Context:
1. Research options
2. Document in `.claude/specs/[feature]/research.md`:
   ```markdown
   ## [Topic]
   **Decision:** [what was chosen]
   **Rationale:** [why]
   **Alternatives:** [what else evaluated]
   ```
3. Update plan with resolved decisions

**Output:** research.md with all NEEDS CLARIFICATION resolved

### 5. Phase 1: Design & Contracts

**Prerequisites:** research.md complete

1. **Data Model** → `.claude/specs/[feature]/data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Interface Contracts** → `.claude/specs/[feature]/contracts/`:
   - Identify what interfaces the project exposes
   - Document contract format (API endpoints, CLI schemas, etc.)
   - Skip if project is purely internal

3. **Quickstart** → `.claude/specs/[feature]/quickstart.md`:
   - Integration/test scenarios
   - How to validate the feature works

4. **Re-check Constitution** after design

**Output:** data-model.md, contracts/*, quickstart.md

### 6. Validation
- [ ] Follows constitution principles
- [ ] Simpler alternatives considered
- [ ] Dependencies identified
- [ ] All NEEDS CLARIFICATION resolved
- [ ] File structure defined
- [ ] Data model documented (if applicable)

### 7. Output

Report:
- Plan file: [path]
- Research items resolved: [count]
- Artifacts generated: [list]
- Ready for tasks: [yes/no]

Recommendation:
- If ready → proceed to `/tasks`
- If research needed → complete research first

## Generated Artifacts

| File | Purpose | When |
|------|---------|------|
| plan.md | Technical approach | Always |
| research.md | Decision log | Phase 0 |
| data-model.md | Entities & relationships | Phase 1 (if data) |
| contracts/ | Interface specs | Phase 1 (if external) |
| quickstart.md | Validation scenarios | Phase 1 |

## Rules
- Keep it simple - justify complexity
- Reference spec requirements
- Consider testability
- No implementation code yet
- Research before design
- Constitution is non-negotiable
