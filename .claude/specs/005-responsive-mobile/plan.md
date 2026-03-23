# Implementation Plan: Responsive Mobile

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-23
**Status:** Draft

## Summary

เพิ่ม responsive layout ด้วย CSS media queries + hamburger toggle state สำหรับ sidebar บนมือถือ

## Technical Context

| Aspect | Decision |
|--------|----------|
| Approach | CSS media queries (no new deps) |
| Breakpoint | 768px |
| Sidebar mobile | Overlay with hamburger toggle |
| Split views | Stacked on mobile with back button |
| New Dependencies | None |

## Constitution Check

- [x] Simplicity — CSS only + 1 state variable
- [x] User First — enable mobile usage
- [x] Codebase Consistency — same patterns

## Modified Files
```
client/src/
├── App.tsx              # Modified: add hamburger toggle state, pass to sidebar
├── components/
│   └── ProjectPanel.tsx # Modified: back button for split views on mobile
└── index.css            # Modified: media queries for all components
```

## Key Decisions

1. **CSS media queries only** — no resize observers or JS width checks
2. **Sidebar overlay** — position: fixed overlay on mobile, not push layout
3. **Split views (Files/Changes)** — on mobile show file list OR content, not both. Back button to return to list
4. **Hamburger icon** — simple text-based (☰) not icon library
5. **Auto-close sidebar** — on project select in mobile
