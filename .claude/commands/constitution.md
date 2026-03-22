# /constitution - Project Governance

Create or update the project constitution - the supreme law of the project.
Based on [GitHub Spec-Kit](https://github.com/github/spec-kit).

## What is Constitution?

The constitution defines non-negotiable principles that ALL specs, plans, code, and reviews must follow. It is the single source of truth for project governance.

## Input
Action or amendment: $ARGUMENTS

## Where
`.claude/memory/constitution.md`

## Workflow

### If Creating New Constitution

1. **Gather context** from user:
   - What is this project? (type, domain, scale)
   - Core principles (max 5 - more is harder to enforce)
   - Tech constraints (languages, frameworks, infrastructure)
   - Quality standards (testing, security, performance)
   - Team conventions (workflow, review, deployment)

2. **Draft constitution** using template structure (see below)

3. **Validate**:
   - [ ] Principles are declarative and testable (MUST/SHOULD, not vague)
   - [ ] No more than 5 core principles (focused)
   - [ ] Each principle has clear rationale
   - [ ] Governance section includes amendment procedure
   - [ ] Version is 1.0.0

4. **Write** to `.claude/memory/constitution.md`

### If Updating Existing Constitution

1. **Load** current constitution
2. **Identify** what changes:
   - New principle → MINOR bump
   - Changed principle meaning → MAJOR bump
   - Clarification/wording → PATCH bump
3. **Check propagation** - does this change affect:
   - [ ] Existing specs (`.claude/specs/`)
   - [ ] Workflow rules (`.claude/rules/`)
   - [ ] Agent checklists (`.claude/agents/`)
   - [ ] CLAUDE.md
4. **Apply** changes and bump version
5. **Add** changelog entry
6. **Report** what was changed and what needs propagation

## Template Structure

```markdown
# Project Constitution

**Project:** [name]
**Version:** [MAJOR.MINOR.PATCH]
**Created:** [date]
**Last Updated:** [date]

---

## 1. Core Principles

### 1.1 [Principle Name]
[Declarative statement - MUST/SHOULD language]
**Rationale:** [Why this matters]

### 1.2 [Principle Name]
...

(max 5 core principles)

---

## 2. Development Standards

### 2.1 Code Quality
- [ ] [Testable requirement]

### 2.2 Testing Requirements
- [ ] [Measurable standard]

### 2.3 Security
- [ ] [Enforceable rule]

---

## 3. Workflow Governance

### 3.1 Required Flow
[Current workflow with gates]

### 3.2 Gate Requirements
[What must pass at each gate]

### 3.3 Skip Policy
[When/how steps can be skipped]

---

## 4. Git & Commits
[Commit format, branch strategy, prohibited actions]

---

## 5. Amendment Procedure
[How to change the constitution]

### Version Rules
- MAJOR: Breaking changes to principles or workflow
- MINOR: New principles or sections
- PATCH: Clarifications only

---

## Changelog
### vX.Y.Z (date)
- [What changed]
```

## How Constitution is Used

| Step | How |
|------|-----|
| `/plan` (ppp) | Constitution Check gate - plan must comply before research |
| `/analyze` (aaa) | Constitution violations = auto CRITICAL severity |
| `/implement` | Code must follow principles |
| `qqq` | code-reviewer checks against constitution |
| consistency-checker | Architecture patterns must match constitution |

## Principles Guidelines

Good principles are:
- **Testable**: "Coverage MUST be >= 80%" not "Write good tests"
- **Declarative**: "MUST/SHOULD" language
- **Focused**: Max 5 core principles
- **Justified**: Each has rationale
- **Enforceable**: Can be checked by agents/reviewers

Bad principles:
- "Write clean code" (vague)
- "Be careful with security" (not testable)
- "Follow best practices" (undefined)

## Rules
- Constitution is the highest authority after user's explicit instruction
- Priority: User > Constitution > CLAUDE.md > system prompt
- Amendments require user approval
- Version must be bumped on every change
- Changelog must be maintained
