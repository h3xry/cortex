# API Contracts: 003-project-manager

**Created:** 2026-03-23

---

## Project Management

### GET /api/projects

List all registered projects.

**Response 200:**
```json
{
  "projects": [
    {
      "id": "a1b2c3d4",
      "name": "myproject",
      "path": "/Users/h3xry/Work/myproject",
      "isGitRepo": true,
      "addedAt": "2026-03-23T10:00:00Z"
    }
  ]
}
```

### POST /api/projects

Add a new project.

**Request Body:**
```json
{ "path": "/Users/h3xry/Work/myproject" }
```

**Response 201:**
```json
{
  "id": "a1b2c3d4",
  "name": "myproject",
  "path": "/Users/h3xry/Work/myproject",
  "isGitRepo": true,
  "addedAt": "2026-03-23T10:00:00Z"
}
```

**Response 400:** `{ "error": "Path does not exist" }`
**Response 409:** `{ "error": "Project already added" }`

### DELETE /api/projects/:id

Remove a project from the list.

**Response 200:** `{ "id": "a1b2c3d4" }`
**Response 404:** `{ "error": "Project not found" }`

---

## File Browser

### GET /api/projects/:id/files?path=

Browse files within a project directory.

**Query Params:**
- `path` (optional) — relative path within project, default: root

**Response 200:**
```json
{
  "entries": [
    { "name": "src", "path": "src", "type": "directory", "size": null },
    { "name": "package.json", "path": "package.json", "type": "file", "size": 1234 }
  ]
}
```

**Response 403:** `{ "error": "Path outside project" }`

### GET /api/projects/:id/files/content?path=

Read file content.

**Query Params:**
- `path` (required) — relative path to file within project

**Response 200:**
```json
{
  "path": "src/index.ts",
  "content": "import express from 'express';\n...",
  "language": "typescript",
  "size": 1234
}
```

**Response 400:** `{ "error": "File too large (max 1MB)" }`
**Response 403:** `{ "error": "Path outside project" }`
**Response 404:** `{ "error": "File not found" }`

---

## Git Integration

### GET /api/projects/:id/git/status

Get git status (changed files).

**Response 200:**
```json
{
  "isGitRepo": true,
  "branch": "main",
  "changes": [
    { "filePath": "src/index.ts", "status": "modified", "additions": 5, "deletions": 2 },
    { "filePath": "src/new-file.ts", "status": "added", "additions": 20, "deletions": 0 }
  ]
}
```

**Response 200 (not a git repo):**
```json
{ "isGitRepo": false, "branch": null, "changes": [] }
```

### GET /api/projects/:id/git/diff?file=

Get diff for a specific file.

**Query Params:**
- `file` (required) — relative file path

**Response 200:**
```json
{
  "filePath": "src/index.ts",
  "hunks": [
    {
      "oldStart": 10,
      "newStart": 10,
      "lines": [
        { "type": "context", "content": "const app = express();", "oldLineNumber": 10, "newLineNumber": 10 },
        { "type": "delete", "content": "app.use(cors());", "oldLineNumber": 11, "newLineNumber": null },
        { "type": "add", "content": "app.use(cors({ origin: ALLOWED_ORIGIN }));", "oldLineNumber": null, "newLineNumber": 11 }
      ]
    }
  ]
}
```

---

## Modified Existing Endpoints

### POST /api/sessions (updated)

Now accepts `projectId` instead of `folderPath`:

```json
{
  "projectId": "a1b2c3d4",
  "allowedTools": ["Read", "Glob", "Grep"]
}
```

Server resolves project path from projectId. `folderPath` still accepted for backward compatibility.
