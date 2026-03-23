# Implementation Plan: Spec Viewer

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Status:** Draft

## Summary

เพิ่ม Specs tab ใน ProjectPanel — browse `.claude/specs/` → เลือก feature → อ่าน markdown ที่ render แล้วพร้อม Mermaid diagrams

## Technical Context

| Aspect | Decision |
|--------|----------|
| Markdown Renderer | react-markdown + remark-gfm |
| Mermaid | mermaid (client-side SVG render) |
| Code Highlighting | prism-react-renderer (existing) |
| API | Reuse /api/projects/:id/files endpoints |
| New Dependencies | react-markdown, remark-gfm, mermaid |

## Constitution Check

- [x] Simplicity — reuse existing file API, no new server code
- [x] User First — read specs without leaving web
- [x] Codebase Consistency — same hook/component patterns

## New/Modified Files
```
client/src/
├── components/
│   ├── SpecBrowser.tsx     # NEW: feature list + file list sidebar
│   ├── MarkdownViewer.tsx  # NEW: render markdown + mermaid
│   └── ProjectPanel.tsx    # Modified: add Specs tab
├── hooks/
│   └── useSpecs.ts         # NEW: fetch spec features/files/content
└── App.tsx                 # No change
```

## Key Decisions

1. **No new server endpoints** — reuse file browser API
2. **Mermaid renders client-side** — detect `mermaid` code blocks, render as SVG
3. **Split view** — left: spec nav (features → files), right: rendered markdown
4. **Dark theme** — markdown styled to match Catppuccin Mocha theme

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |
