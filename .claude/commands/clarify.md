# /clarify (ccc) - Resolve Ambiguities

Identify and resolve ambiguities in the feature specification before planning.
Based on [GitHub Spec-Kit](https://github.com/github/spec-kit).

## Input
Feature spec path or current feature: $ARGUMENTS

## Workflow

### 1. Load Context
- Read `.claude/specs/[current-feature]/spec.md`
- Read `.claude/memory/constitution.md`
- Identify items marked "NEEDS CLARIFICATION"

### 2. Structured Ambiguity Scan

Check these 12 dimensions and mark status:

| Category | Status |
|----------|--------|
| **Functional Scope & Behavior** - Core goals, out-of-scope, user roles | |
| **Domain & Data Model** - Entities, attributes, relationships, lifecycle | |
| **Interaction & UX Flow** - User journeys, error/empty/loading states | |
| **Performance** - Latency, throughput targets | |
| **Scalability** - Horizontal/vertical, limits | |
| **Reliability & Availability** - Uptime, recovery expectations | |
| **Observability** - Logging, metrics, tracing | |
| **Security & Privacy** - AuthN/Z, data protection, threats | |
| **Integration & Dependencies** - External services, failure modes, protocols | |
| **Edge Cases & Failure Handling** - Negative scenarios, rate limiting, conflicts | |
| **Constraints & Tradeoffs** - Technical constraints, rejected alternatives | |
| **Terminology & Consistency** - Canonical terms, avoided synonyms | |

For each Partial/Missing category → candidate question (unless low impact or better deferred to planning).

### 3. Generate Questions

Rules:
- Maximum 5 questions total
- Prioritize by: impact x uncertainty
- Each question must be answerable with:
  - Multiple choice (2-5 options), OR
  - Short phrase (<=5 words)
- Only include questions that materially impact architecture, data modeling, task decomposition, test design, or compliance
- Ensure category coverage balance
- If >5 categories unresolved → select top 5 by (Impact x Uncertainty)

### 4. Ask Questions (One at a Time)

For multiple-choice questions:
1. **Analyze all options** and determine the most suitable
2. Present recommendation prominently:
   ```
   **Recommended:** Option [X] - [1-2 sentence reasoning]
   ```
3. Show all options as table:

   | Option | Description |
   |--------|-------------|
   | A | [Description] |
   | B | [Description] |
   | C | [Description] |

4. `Reply with option letter, "yes" to accept recommendation, or your own answer.`

For short-answer questions:
1. Provide suggested answer: `**Suggested:** [answer] - [reasoning]`
2. `Reply "yes" to accept, or provide your own (<=5 words).`

After user answers:
- If "yes"/"recommended"/"suggested" → use your recommendation
- Validate answer fits constraints
- Record and move to next question

**Stop when:**
- All critical ambiguities resolved early
- User signals "done"/"skip"/"proceed"
- 5 questions reached

### 5. Update Spec (After EACH Answer)

1. Ensure `## Clarifications` section exists
2. Add `### Session YYYY-MM-DD` subheading
3. Append: `- Q: [question] → A: [answer]`
4. Apply clarification to the appropriate section:
   - Functional → update Functional Requirements
   - Data → update Key Entities
   - Non-functional → add measurable criteria
   - Edge case → add to Edge Cases
   - Terminology → normalize across spec
5. If clarification invalidates earlier text → replace (no contradictions)
6. **Save spec after each integration** (prevent context loss)

### 6. Validation (After Each Write)

- [ ] One bullet per accepted answer in Clarifications
- [ ] Total questions <= 5
- [ ] No lingering placeholders the new answer resolved
- [ ] No contradictory earlier statements remain
- [ ] Markdown structure valid
- [ ] Terminology consistent across sections

### 7. Completion Report

```markdown
## Clarification Summary

Questions asked: [N]
Spec updated: [path]
Sections touched: [list]

| Category | Status |
|----------|--------|
| Functional Scope | Resolved / Deferred / Clear / Outstanding |
| Domain & Data | ... |
| ... | ... |

Recommendation:
- All clear → /plan
- Outstanding → /clarify again or defer
```

## Rules
- Never assume - always ask
- One question at a time
- Save after each answer (prevent context loss)
- Mark deferred items explicitly
- Never reveal future queued questions
- Recommend best option for each question
- Max 5 questions per session
