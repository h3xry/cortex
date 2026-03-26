# Implementation Plan: Multi-Session Split View

**Spec:** [spec.md](./spec.md)
**Created:** 2026-03-26
**Status:** Draft

## Summary

Render 2 ProjectPanel instances side-by-side ใน `.main-content` โดยใช้ flexbox + draggable divider. แต่ละ panel เลือก project + tab อิสระ. ไม่ต้องเพิ่ม server-side logic — เป็น client-only feature. ProjectPanel ทำงานอิสระอยู่แล้ว (self-contained hooks + state).

## Technical Context

| Aspect | Decision |
|--------|----------|
| Language/Version | TypeScript (React 19) |
| Primary Dependencies | None new |
| Storage | In-memory (split state ไม่ persist) |
| Testing | Vitest |
| Target Platform | Web (desktop only, hidden on mobile) |
| Project Type | Client-side feature |
| Performance Goals | Drag < 16ms/frame, terminal resize auto |
| Constraints | Min panel 20%, mobile < 768px ซ่อน split |

## Constitution Check

- [x] Spec aligns with project principles (User First)
- [x] No constitution violations
- [x] Scope is appropriate (client-only, reuse existing ProjectPanel)

## Project Structure

### Documentation
```
.claude/specs/017-split-view/
├── spec.md          ✅
├── plan.md          # This file
├── research.md      ✅
├── data-model.md
└── quickstart.md
```

### New Files
```
client/src/
├── components/
│   ├── SplitView.tsx          # Split container + divider + drag logic
│   └── PanelSelector.tsx      # Project + tab picker for right panel
└── hooks/
    └── useSplitView.ts        # Split state (active, direction, ratio)
```

### Modified Files
```
client/src/
├── App.tsx                    # Add split state, render SplitView
├── components/ProjectPanel.tsx # Add optional compact header for split mode
└── index.css                  # Split layout + divider + focus styles
```

## Architecture

### Layout Structure

```
.app
├── .sidebar (300px fixed)
└── .main-content
    ├── [Single Mode] → ProjectPanel (full width)
    └── [Split Mode] → SplitView
        ├── .split-panel-left (flex: ratio)
        │   └── ProjectPanel (project A)
        ├── .split-divider (4px)
        └── .split-panel-right (flex: 1-ratio)
            └── ProjectPanel (project B) or PanelSelector
```

### State Management

```
App.tsx state:
  splitMode: boolean              → split on/off
  splitDirection: "h" | "v"       → horizontal/vertical
  splitRatio: number              → 0.2 - 0.8 (default 0.5)
  rightProject: Project | null    → project สำหรับ panel ขวา
  focusedPanel: "left" | "right"  → panel ที่ active

Left panel = selectedProject (existing state)
Right panel = rightProject (new state)
```

### SplitView Component

```
SplitView
├── Props: leftContent, rightContent, direction, ratio, onRatioChange
├── Divider with mousedown → track mousemove → calculate ratio → mouseup
├── CSS: display flex, direction row/column
├── Each panel: overflow hidden, flex based on ratio
└── Divider: 4px, cursor col-resize/row-resize, hover highlight
```

### Drag Logic

```typescript
// useSplitView hook
onMouseDown(divider) →
  document.onmousemove = (e) => {
    const container = containerRef.getBoundingClientRect();
    const pos = direction === "h"
      ? (e.clientX - container.left) / container.width
      : (e.clientY - container.top) / container.height;
    setRatio(clamp(pos, 0.2, 0.8));
  }
  document.onmouseup = () => cleanup
```

### Focus Management

- Click ใน panel → set focusedPanel
- Focused panel มี border highlight (2px solid #89b4fa)
- TerminalInput ส่ง input ไปที่ panel ที่ focus
- ใน split mode, ProjectPanel รับ prop `isFocused` เพื่อ visual indicator

### PanelSelector

เมื่อ panel ขวายังไม่ได้เลือก project:

```
┌────────────────────┐
│  Select Content     │
│                     │
│  Project: [dropdown]│
│  Tab: [Terminal ▾]  │
│                     │
│  [Open]             │
└────────────────────┘
```

### Integration with Existing Features

- **Notifications** — navigate ไป panel ซ้ายเสมอ (primary)
- **Sidebar project click** — เปิดใน panel ที่ focus
- **Session Manager** — เปิดใน panel ที่ focus
- **Terminal resize** — ResizeObserver ของแต่ละ terminal จัดการเอง (ไม่ต้องแก้)

### Split Button

เพิ่มปุ่มใน ProjectPanel header:
- `⊞` Split button → เปิด split mode
- `✕` Close split → ปิด split mode (panel ขวาหาย)
- `⇄` Toggle direction → สลับ horizontal/vertical

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| None | — | — |

## Validation

- [x] Follows constitution (Simplicity — reuse ProjectPanel, no new deps)
- [x] Simpler alternatives considered (iframe rejected, tab duplication rejected)
- [x] Dependencies identified (None new)
- [x] All NEEDS CLARIFICATION resolved
- [x] File structure defined
- [x] Data model documented
