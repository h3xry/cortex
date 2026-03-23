# Quickstart & Validation: 003-project-manager

**Created:** 2026-03-23

---

## Validation Scenarios

### Scenario 1: Add Project
1. Open web app
2. Type `/Users/h3xry/Work/labs/tacking-n-learning` in the add project input
3. Click Add
4. **Pass:** Project "tacking-n-learning" appears in sidebar

### Scenario 2: Add Invalid Path
1. Type `/nonexistent/path` and click Add
2. **Pass:** Error message "Path does not exist" shown

### Scenario 3: Launch Session from Project
1. Click a project in sidebar
2. Click Launch (with tool selector)
3. **Pass:** Claude Code session starts in that project directory

### Scenario 4: Browse Files
1. Select a project
2. Click Files tab
3. Click into `src/` directory
4. Click a `.ts` file
5. **Pass:** File content shown with TypeScript syntax highlighting

### Scenario 5: View Git Changes
1. Select a project with uncommitted changes
2. Click Changes tab
3. **Pass:** List of changed files with status badges (M/A/D)

### Scenario 6: View File Diff
1. From Changes tab, click a modified file
2. **Pass:** Diff view shows old/new lines with green (add) / red (delete) coloring

### Scenario 7: Persistence
1. Add a project
2. Refresh the page
3. **Pass:** Project still in the list

### Scenario 8: Remove Project
1. Click remove button on a project
2. **Pass:** Project removed from list, files on disk untouched
