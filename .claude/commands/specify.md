# /specify (sss) - Feature Specification

Create a feature specification focusing on WHAT and WHY, not HOW.
Based on [GitHub Spec-Kit](https://github.com/github/spec-kit).

## Input
Feature description from user: $ARGUMENTS

## Workflow

### 1. Generate Feature ID & Directory
- Extract 2-4 word identifier from description (action-noun format)
- Check `.claude/specs/` for existing features
- Determine next sequence number (001, 002, etc.)
- Create directory: `.claude/specs/###-feature-name/`

### 2. Fill Specification

Use this template structure:

```markdown
# Feature: [Name]

**ID:** ###-feature-name
**Created:** [Date]
**Status:** Draft

## Problem Statement
[What problem does this solve? Why does it matter?]

## User Scenarios & Testing

<!--
  User stories MUST be PRIORITIZED as user journeys ordered by importance.
  Each story must be INDEPENDENTLY TESTABLE - implementing just ONE
  should deliver a viable MVP.
-->

### User Story 1 - [Title] (Priority: P1)
[User journey in plain language]

**Why this priority**: [Value explanation]
**Independent Test**: [How to test this story alone]

**Acceptance Scenarios**:
1. **Given** [state], **When** [action], **Then** [outcome]
2. **Given** [state], **When** [action], **Then** [outcome]

### User Story 2 - [Title] (Priority: P2)
...

### Edge Cases
- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Functional Requirements
- **FR-001**: System MUST [capability]
- **FR-002**: System MUST [capability]
- **FR-003**: [NEEDS CLARIFICATION: specific question]

## Key Entities (if data involved)
- **[Entity]**: [What it represents, key attributes]

## Success Criteria (technology-agnostic, measurable)
- **SC-001**: [Measurable outcome from user perspective]
- **SC-002**: [Measurable outcome from user perspective]

## Out of Scope
- [What this feature does NOT include]

## Assumptions
- [Reasonable defaults documented here]
```

### 3. Specification Rules

**Make informed guesses** - don't ask about everything:
- Data retention → industry standard
- Performance → standard app expectations
- Error handling → user-friendly messages with fallbacks
- Auth → standard session/OAuth2 for web
- Integration → project-appropriate patterns

**NEEDS CLARIFICATION limits:**
- Maximum 3 markers total
- Only for decisions that significantly impact scope/UX
- Prioritize: scope > security/privacy > UX > technical

**Success Criteria must be:**
- Measurable (time, percentage, count)
- Technology-agnostic (no frameworks/databases)
- User-focused (outcomes, not system internals)
- Verifiable without knowing implementation

### 4. Quality Validation

After writing spec, validate:

| Check | Pass? |
|-------|-------|
| No implementation details (languages, frameworks) | |
| Focused on user value and business needs | |
| Written for non-technical stakeholders | |
| Requirements are testable and unambiguous | |
| Success criteria are measurable & tech-agnostic | |
| All acceptance scenarios defined | |
| Edge cases identified | |
| Scope clearly bounded | |
| Max 3 NEEDS CLARIFICATION markers | |

If validation fails → fix and re-validate (max 3 iterations).

### 5. Handle Clarifications

If NEEDS CLARIFICATION markers remain, present to user:

```markdown
## Question [N]: [Topic]
**Context**: [Quote spec section]
**What we need to know**: [Question]

| Option | Answer | Implications |
|--------|--------|--------------|
| A | [Answer] | [Impact] |
| B | [Answer] | [Impact] |
| C | [Answer] | [Impact] |

**Your choice**: _[Wait for response]_
```

### 6. Output

Report:
- Spec file path
- Feature ID & branch name
- Validation results
- Open questions count
- Recommendation: `/clarify` or `/plan`

## Rules
- Technology-agnostic (no code, no framework names)
- Written for non-technical stakeholders
- Each scenario independently testable
- Mark unclear items explicitly (max 3)
- Make informed guesses, document in Assumptions
