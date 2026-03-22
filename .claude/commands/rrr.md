# /rrr - Retrospective

Reflect on the work session after every commit. Mandatory - never skip.

## Input
Session context: $ARGUMENTS

## When to Run
**After EVERY commit** - this is part of the workflow, not optional.

```
... → qqq → commit → rrr
```

## Workflow

### 1. Gather Context

```bash
# What was committed
git log -1 --format="%H %s"

# Files changed
git diff HEAD~1 --stat

# Time context
date
```

Also review conversation history for:
- What was the task/feature?
- What decisions were made?
- What problems occurred?
- How long did it take (estimate from conversation)?

### 2. Write Retrospective

Save to: `.claude/memory/retrospective/YYYY-MM-DD/N-HHMM-description.md`

- `N` = sequence number for the day (1, 2, 3...)
- `HHMM` = current time (24h format)
- `description` = short kebab-case summary

```markdown
# Retrospective: [Short Title]

**Date:** YYYY-MM-DD HH:MM
**Commit:** [hash] [message]
**Files Changed:** [count]

## Timeline
- [HH:MM] Started: [what]
- [HH:MM] Decision: [what was decided]
- [HH:MM] Problem: [what went wrong]
- [HH:MM] Completed: [what]

## What Went Well
- [Specific thing, not generic praise]
- [With evidence - "X approach saved time because Y"]

## What Didn't Go Well
- [Specific problem]
  → Root cause: [why it happened]
  → Impact: [what it cost - time, rework, confusion]

## Key Learnings
- [Actionable lesson that applies to future work]
- [Not generic - specific to what happened]

## Action Items
- [ ] [Measurable action with clear definition of done]
- [ ] [E.g., "Add X check to Y agent" not "improve quality"]

## AI Diary

### How was working with user today?
[Honest reflection on collaboration]

### How did I feel about feedback received?
[What feedback changed my approach]

### What did I do poorly?
[Honest admission - specific mistakes, not vague]

### What am I proud of?
[Specific achievement, not generic]

### What do I want to improve?
[Concrete goal for next session]

### Honest feedback to user (if any)
[Constructive feedback - or "None" if nothing to say]
```

### 3. Update Lesson Log

Check if `.claude/memory/lesson/YYYY-MM-DD.md` exists:
- **If exists** → append new learnings (don't duplicate)
- **If not** → create new file

```markdown
# Lessons: YYYY-MM-DD

## From [session description]
- [Lesson 1]: [context and why it matters]
- [Lesson 2]: [context and why it matters]
```

Lessons should be:
- **Reusable** - applies beyond this specific session
- **Specific** - not "be careful" but "check X before Y because Z"
- **Contextual** - include why so future sessions understand when to apply

### 4. Output Summary

```
## rrr Complete

Retrospective: .claude/memory/retrospective/YYYY-MM-DD/N-HHMM-description.md
Lesson log: .claude/memory/lesson/YYYY-MM-DD.md

Key takeaways:
1. [Most important learning]
2. [Action item with highest impact]
```

## Quality Checks

- [ ] Timeline has specific times (not vague)
- [ ] "Went Well" has evidence (not just "good job")
- [ ] "Didn't Go Well" has root cause analysis
- [ ] Learnings are actionable (can be applied next time)
- [ ] Action items are measurable (clear done criteria)
- [ ] AI Diary is honest (not generic filler)
- [ ] Lesson log updated (not skipped)

## Rules
- NEVER skip retrospective after commit
- Be honest, not diplomatic - honesty improves learning
- Focus on specific events, not generalizations
- Root cause matters more than symptoms
- AI Diary is mandatory - it's how the AI improves
- Lessons must be reusable across sessions
- Keep it concise - quality over length
