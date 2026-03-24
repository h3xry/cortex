# Data Model: 011-project-plan

## Entities

### Task
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated: `TASK-001`, `TASK-002`, ... |
| title | string | Task title (bold text in markdown) |
| description | string \| null | Optional description |
| tags | string[] | Inline tags: `[Feature]`, `[High]`, `[Sell-sync-api]` |
| status | TaskStatus | Kanban column: Backlog/Sprint/InProgress/Review/Done |
| subTasks | SubTask[] | Nested checkbox items |
| effort | string \| null | Effort estimate: `"Back 1.5 manday"` |
| milestoneId | string \| null | Linked milestone |
| sprintId | string \| null | Linked sprint |
| done | boolean | `[x]` = true, `[ ]` = false |
| createdAt | string | ISO 8601 datetime |
| updatedAt | string | ISO 8601 datetime |

### SubTask
| Field | Type | Description |
|-------|------|-------------|
| title | string | Sub-task description |
| done | boolean | `[x]` = true, `[ ]` = false |
| effort | string \| null | Optional effort estimate |

### Milestone
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated: `MS-001`, `MS-002`, ... |
| title | string | Milestone name |
| deadline | string | ISO 8601 date (YYYY-MM-DD) |
| taskRefs | string[] | Task titles linked to this milestone |

### Sprint
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated: `SP-001`, `SP-002`, ... |
| title | string | Sprint name |
| startDate | string | ISO 8601 date |
| endDate | string | ISO 8601 date |
| taskRefs | string[] | Task titles linked to this sprint |

### Plan (container)
| Field | Type | Description |
|-------|------|-------------|
| tasks | Task[] | All tasks across all Kanban sections |
| milestones | Milestone[] | All milestones |
| sprints | Sprint[] | All sprints |

## TaskStatus Enum
```
"Backlog" | "Sprint" | "InProgress" | "Review" | "Done"
```

Maps to markdown sections:
| Status | Markdown Heading |
|--------|-----------------|
| Backlog | `## Backlog` |
| Sprint | `## Sprint` |
| InProgress | `## In Progress` |
| Review | `## Review` |
| Done | `## Done` |

## Markdown ↔ Data Mapping

### Task Line Format
```
- [ ] **[Tag1] Title** - [Tag2] [Tag3]
  - [ ] Sub-task 1 — Back 1 manday
  - [x] Sub-task 2
```

Parsing rules:
1. `- [ ]` / `- [x]` → done: false/true
2. `**...**` → title (with tags extracted)
3. `[Word]` inside bold or after `- ` → tags[]
4. `— Back X manday` or `— Front X manday` → effort
5. Indented `- [ ]` / `- [x]` → subTasks[]
6. `~~text~~` → visual indicator of done (optional, done state comes from checkbox)

### Milestone Section Format
```
## Milestone Title - YYYY-MM-DD
- Task reference 1
- Task reference 2
```

### Sprint Section Format
```
## Sprint Title - YYYY-MM-DD to YYYY-MM-DD
- Task reference 1
- Task reference 2
```

## Computed Fields (not stored, calculated at read time)

| Field | Computation |
|-------|-------------|
| milestone.progress | count(tasks where done=true) / count(tasks) linked to milestone |
| milestone.isOverdue | deadline < today AND progress < 100% |
| milestone.isUrgent | deadline - today <= 3 days AND progress < 100% |
| sprint.isActive | startDate <= today <= endDate |
| sprint.velocity | count(done tasks) for completed sprints |
| sprint.remainingDays | endDate - today (if active) |
| dashboard.byStatus | group tasks by status, count each |
| dashboard.byPriority | group tasks by P1/P2/P3 tag, count each |

## Validation Rules

- Task title: required, non-empty
- Task ID: auto-generated, unique within project
- Milestone deadline: valid date (YYYY-MM-DD)
- Sprint dates: startDate <= endDate, valid dates
- Tags: free-text, no validation (user-defined)
- Effort: free-text pattern matching (optional)
