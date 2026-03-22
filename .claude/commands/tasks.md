# /tasks (ttt) - Task Breakdown

Generate actionable, dependency-ordered tasks organized by user story.
Based on [GitHub Spec-Kit](https://github.com/github/spec-kit).

## Prerequisites
- `.claude/specs/[feature]/spec.md` exists
- `.claude/specs/[feature]/plan.md` exists and approved

## Input
Feature to break down: $ARGUMENTS

## Workflow

### 1. Load Context
- **Required:** plan.md (tech stack, structure), spec.md (user stories with priorities)
- **Optional:** data-model.md (entities), contracts/ (interfaces), research.md (decisions), quickstart.md (test scenarios)

### 2. Extract Information

From plan.md: tech stack, libraries, project structure
From spec.md: user stories with priorities (P1, P2, P3...)
From data-model.md: entities → map to user stories
From contracts/: interfaces → map to user stories

### 3. Task Format (REQUIRED)

Every task MUST follow this format:
```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

| Component | Required | Description |
|-----------|----------|-------------|
| `- [ ]` | Always | Markdown checkbox |
| `T001` | Always | Sequential ID in execution order |
| `[P]` | If parallel | Different files, no dependencies |
| `[US1]` | Story phase only | Maps to user story from spec |
| Description | Always | Clear action with exact file path |

**Examples:**
- `- [ ] T001 Create project structure per plan`
- `- [ ] T005 [P] Implement auth middleware in src/middleware/auth.go`
- `- [ ] T012 [P] [US1] Create User model in pkg/user/model.go`
- `- [ ] T014 [US1] Implement UserService in pkg/user/service.go`

### 4. Generate Tasks by Phase

```markdown
# Tasks: [Feature Name]

**Plan:** [link to plan.md]
**Created:** [Date]
**Total Tasks:** [N]

## Phase 1: Setup
- [ ] T001 [P] Initialize project structure
- [ ] T002 [P] Add dependencies
- [ ] T003 Configure environment

## Phase 2: Foundation (BLOCKS all stories)
- [ ] T004 Create base models
- [ ] T005 [P] Setup test fixtures
- [ ] T006 [P] Configure logging/error handling

**Checkpoint:** Foundation ready

## Phase 3: User Story 1 - [Title] (P1) MVP
**Goal:** [What this delivers]
**Independent Test:** [How to verify alone]

### Tests (if TDD requested)
- [ ] T007 [P] [US1] Contract test in tests/...
- [ ] T008 [P] [US1] Integration test in tests/...

### Implementation
- [ ] T009 [P] [US1] Create [Model] in pkg/.../model.go
- [ ] T010 [US1] Implement [Service] in pkg/.../service.go
- [ ] T011 [US1] Implement [Handler] in pkg/.../handler.go

**Checkpoint:** US1 independently functional

## Phase 4: User Story 2 - [Title] (P2)
...

## Phase N: Polish & Cross-Cutting
- [ ] TXXX [P] Documentation
- [ ] TXXX Code cleanup
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

## Dependencies
- Setup → Foundation → User Stories (parallel) → Polish
- Within story: Tests → Models → Services → Handlers
- Stories can run in parallel after Foundation

## Implementation Strategy

### MVP First (Recommended)
1. Setup + Foundation
2. User Story 1 → Test → Validate
3. STOP and validate MVP
4. Continue with US2, US3...

### Incremental Delivery
Each story adds value without breaking previous stories.
```

### 5. Task Organization Rules

**From User Stories (PRIMARY):**
- Each user story (P1, P2, P3) gets its own phase
- Map models, services, handlers to their story
- Mark story dependencies (most should be independent)

**From Data Model:**
- Map entities to user stories that need them
- Shared entities → Setup or Foundation phase

**From Contracts:**
- Map interfaces → user story they serve
- Contract tests before implementation

### 6. Task Validation
- [ ] Each task independently executable
- [ ] File paths explicit
- [ ] Test tasks before implementation (TDD)
- [ ] No circular dependencies
- [ ] Parallelizable tasks marked [P]
- [ ] ALL tasks follow checklist format
- [ ] Each story independently testable

### 7. Output

Report:
- Tasks file: `.claude/specs/[feature]/tasks.md`
- Total tasks: [N]
- Per user story: [breakdown]
- Parallelizable: [N]
- Phases: [N]
- MVP scope: [User Story 1]

Ready for: `/analyze` (optional) or `/implement`

## Rules
- Tasks must be LLM-executable without extra context
- Test-first approach (write test -> implement -> verify)
- Each user story independently completable
- Mark setup/foundation as blocking
- Include exact file paths
- No vague tasks
