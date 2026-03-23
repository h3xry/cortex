# Tasks: Responsive Mobile

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-23
**Total Tasks:** 8

---

## Phase 1: Mobile Sidebar (P1) MVP

- [ ] T001 Add hamburger toggle state and button in `client/src/App.tsx` — show ☰ button on mobile, toggle sidebar visibility, auto-close on project select
- [ ] T002 Add CSS media queries for sidebar in `client/src/index.css` — hide sidebar on < 768px, show as fixed overlay when open, hamburger button styling, overlay backdrop

**Checkpoint:** Sidebar works as overlay on mobile

---

## Phase 2: Content Full-Width

- [ ] T003 Add CSS media queries for main content in `client/src/index.css` — full width on mobile, panel tabs scrollable, terminal input responsive
- [ ] T004 Add CSS for folder picker modal responsive in `client/src/index.css` — full width on mobile, max-height adjusted

**Checkpoint:** Content and modals display correctly on mobile

---

## Phase 3: Split View Navigation

- [ ] T005 Add mobile file/content navigation in `client/src/components/ProjectPanel.tsx` — on mobile: show file list OR content (not both), back button to return to list, same for Changes and Specs tabs
- [ ] T006 Add CSS for stacked split views in `client/src/index.css` — files-tab/changes-tab/specs-tab stacked on mobile, back button styling

**Checkpoint:** Split views navigable on mobile

---

## Phase 4: Touch Polish

- [ ] T007 Add CSS touch targets in `client/src/index.css` — min 44px height for project items, file items, tabs, buttons on mobile
- [ ] T008 Test manually — resize browser to 375px, verify all features work

---

## Dependencies

```
Phase 1 (Sidebar) ← MVP
  └── Phase 2 (Content)
        └── Phase 3 (Split Views)
              └── Phase 4 (Touch Polish)
```
