# API Contracts: 011-project-plan

All endpoints scoped under `/api/projects/:id/plan`.

---

## GET /api/projects/:id/plan

Get full plan for a project (parsed from `.md` file).

**Response 200:**
```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "[Feature] ระบบจัดส่ง",
      "description": null,
      "tags": ["Feature", "High", "Sell-sync-api"],
      "status": "Backlog",
      "subTasks": [
        { "title": "เลือก Provider", "done": false, "effort": "Back 1.5 manday" },
        { "title": "ตั้งค่าค่าส่ง", "done": false, "effort": "Back 1 manday" }
      ],
      "effort": null,
      "milestoneId": null,
      "sprintId": null,
      "done": false,
      "createdAt": "2026-03-24T10:00:00Z",
      "updatedAt": "2026-03-24T10:00:00Z"
    }
  ],
  "milestones": [
    {
      "id": "MS-001",
      "title": "MVP Launch",
      "deadline": "2026-04-15",
      "taskRefs": ["[Feature] ระบบไลฟ์สด", "[Feature] ระบบจัดการสินค้า"],
      "progress": 0.4,
      "isOverdue": false,
      "isUrgent": false
    }
  ],
  "sprints": [
    {
      "id": "SP-001",
      "title": "Sprint 1",
      "startDate": "2026-03-24",
      "endDate": "2026-04-07",
      "taskRefs": ["[Feature] ระบบไลฟ์สด"],
      "isActive": true,
      "velocity": null,
      "remainingDays": 14
    }
  ]
}
```

**Response 200 (no plan file exists yet):**
```json
{ "tasks": [], "milestones": [], "sprints": [] }
```

---

## POST /api/projects/:id/plan/tasks

Add a new task to a Kanban section.

**Request:**
```json
{
  "title": "[Feature] ระบบใหม่",
  "tags": ["Feature", "High"],
  "status": "Backlog",
  "effort": "Back 2 manday",
  "subTasks": [
    { "title": "Design API", "done": false },
    { "title": "Implement", "done": false }
  ]
}
```

**Response 201:** Created task object with auto-generated `id`
**Response 400:** `{ "error": "title is required" }`

---

## PATCH /api/projects/:id/plan/tasks/:taskId

Update task fields. Partial update — only provided fields are changed.

**Request (move to In Progress):**
```json
{ "status": "InProgress" }
```

**Request (update sub-task done):**
```json
{
  "subTasks": [
    { "title": "Design API", "done": true },
    { "title": "Implement", "done": false }
  ]
}
```

**Response 200:** Updated task object
**Response 404:** `{ "error": "Task not found" }`

---

## DELETE /api/projects/:id/plan/tasks/:taskId

**Response 200:** `{ "id": "TASK-001" }`
**Response 404:** `{ "error": "Task not found" }`

---

## POST /api/projects/:id/plan/milestones

**Request:**
```json
{
  "title": "MVP Launch",
  "deadline": "2026-04-15",
  "taskRefs": ["[Feature] ระบบไลฟ์สด"]
}
```

**Response 201:** Created milestone with auto `id` + computed `progress`/`isOverdue`/`isUrgent`

---

## PATCH /api/projects/:id/plan/milestones/:milestoneId

**Request:**
```json
{ "deadline": "2026-04-20" }
```

**Response 200:** Updated milestone
**Response 404:** `{ "error": "Milestone not found" }`

---

## DELETE /api/projects/:id/plan/milestones/:milestoneId

**Response 200:** `{ "id": "MS-001" }`

---

## POST /api/projects/:id/plan/sprints

**Request:**
```json
{
  "title": "Sprint 1",
  "startDate": "2026-03-24",
  "endDate": "2026-04-07",
  "taskRefs": ["[Feature] ระบบไลฟ์สด"]
}
```

**Response 201:** Created sprint with auto `id` + computed fields

---

## PATCH /api/projects/:id/plan/sprints/:sprintId

**Response 200:** Updated sprint

---

## DELETE /api/projects/:id/plan/sprints/:sprintId

**Response 200:** `{ "id": "SP-001" }`

---

## GET /api/projects/:id/plan/raw

Get raw `.md` content (for AI analysis or manual editing).

**Response 200:**
```json
{ "content": "# Tasks\n\n## Backlog\n- [ ] **[Feature] ..." }
```

## PUT /api/projects/:id/plan/raw

Overwrite `.md` file with raw content (advanced/AI use).

**Request:**
```json
{ "content": "# Tasks\n\n## Backlog\n..." }
```

**Response 200:** `{ "ok": true }`
