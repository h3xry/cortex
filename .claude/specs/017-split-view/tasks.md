# Tasks: Multi-Session Split View

**Plan:** [plan.md](./plan.md)
**Created:** 2026-03-26
**Total Tasks:** 12

## Phase 1: Foundation — Split Hook + Container (BLOCKS all stories)

- [x] T001 Create `client/src/hooks/useSplitView.ts` — state: splitMode (bool), direction ("h"/"v"), ratio (0.5), rightProject (Project|null), focusedPanel ("left"/"right"). Functions: openSplit(), closeSplit(), toggleDirection(), setRatio(n), setRightProject(p), setFocusedPanel(side). Clamp ratio to 0.2-0.8
- [x] T002 Create `client/src/components/SplitView.tsx` — flex container that renders leftContent + divider + rightContent. Props: direction, ratio, onRatioChange, children[2]. Divider: 4px bar, mousedown → track mousemove → calc ratio from mouse position relative to container → mouseup cleanup. Cursor: col-resize (h) / row-resize (v). Divider hover highlight
- [x] T003 Add split CSS to `client/src/index.css` — .split-view (flex container), .split-panel (overflow hidden), .split-divider (4px, bg #313244, hover #89b4fa), .split-panel.focused (border 2px solid #89b4fa), responsive hide split button on < 768px

**Checkpoint:** SplitView component + hook ready

## Phase 2: US1 — Split Terminal + Notes (P1) MVP

**Goal:** เปิด split → panel ซ้าย terminal + panel ขวา notes (หรือ tab อื่น) ของ project เดียวกัน
**Independent Test:** กด Split → เห็น 2 panels → ซ้าย terminal ขวา notes

- [x] T004 Create `client/src/components/PanelSelector.tsx` — UI สำหรับเลือก content ของ panel ขวา: project dropdown (จาก projects list), tab selector (Terminal/Files/Changes/Specs/Notes). กด Open → set rightProject + rightTab. แสดงเมื่อ rightProject ยังเป็น null
- [x] T005 [US1] Add split state + buttons to `client/src/App.tsx` — import useSplitView, add split/close/toggle buttons ใน main content header. เมื่อ splitMode=true render SplitView กับ 2 ProjectPanels. Left = selectedProject, Right = rightProject. Pass projects list ให้ PanelSelector
- [x] T006 [US1] Add split-aware props to `client/src/components/ProjectPanel.tsx` — new optional props: isSplitMode (boolean), isFocused (boolean), onFocus (callback). เมื่อ isSplitMode=true แสดง compact header (ไม่มี hamburger). onClick บน panel → call onFocus

**Checkpoint:** Split terminal + any tab ทำงาน (project เดียวกัน)

## Phase 3: US2 — Cross-Project Sessions (P1)

**Goal:** panel ขวาเลือก project อื่นได้ + 2 terminals stream พร้อมกัน
**Independent Test:** split → ซ้าย project A → ขวา project B → ทั้งสอง stream output

- [x] T007 [US2] Wire PanelSelector with full project list in `client/src/App.tsx` — PanelSelector receives all projects, เลือก project ต่าง → set rightProject. ProjectPanel ขวา key={rightProject.id} ให้ remount เมื่อเปลี่ยน project
- [x] T008 [US2] Add focus management for terminal input — click ใน panel → setFocusedPanel. TerminalInput ใน panel ที่ไม่ focus ยังพิมพ์ได้แต่ visual indicator ต่างกัน (focused panel มี blue border)

**Checkpoint:** 2 projects + 2 terminals ทำงานพร้อมกัน, input ไปถูก panel

## Phase 4: US3 — Drag to Resize (P1)

**Goal:** drag divider ปรับขนาด panels
**Independent Test:** drag divider ไปซ้าย → panel ซ้ายเล็กลง → terminal refit

- [x] T009 [US3] Implement drag logic in `client/src/components/SplitView.tsx` — mousedown on divider → addEventListener mousemove/mouseup on document. Calculate ratio = mousePos / containerSize. Clamp 0.2-0.8. Set ratio via onRatioChange. Add touch support (touchstart/touchmove/touchend). Prevent text selection during drag (user-select: none on body)

**Checkpoint:** Drag resize ทำงาน + terminal auto-refit via ResizeObserver

## Phase 5: US4 — Toggle Direction (P2)

**Goal:** สลับ horizontal ↔ vertical
**Independent Test:** กด toggle → layout เปลี่ยนจากซ้าย-ขวาเป็นบน-ล่าง

- [x] T010 [US4] Add direction toggle button + CSS in `client/src/App.tsx` and `client/src/index.css` — button ⇄ ใน split header. Toggle direction "h"↔"v". SplitView flex-direction: row (h) / column (v). Divider cursor: col-resize (h) / row-resize (v). Ratio calc uses width (h) / height (v)

**Checkpoint:** Toggle direction ทำงาน, content ไม่ reset

## Phase 6: US5 — Panel Content Selector (P2)

**Goal:** เปลี่ยน content ของ panel ขวาได้หลังจากเลือกแล้ว
**Independent Test:** panel ขวาแสดง terminal → กด selector → เปลี่ยนเป็น Changes

- [x] T011 [US5] Add re-select button to right panel header in `client/src/App.tsx` — small button ใน panel ขวา header ให้เปลี่ยน project/tab. กด → reset rightProject to null → แสดง PanelSelector ใหม่

## Phase 7: Polish

- [x] T012 Run quickstart.md validation — test all 8 scenarios: open split, terminal+notes, cross-project, focus+input, drag resize, toggle direction, close split, mobile hide

## Dependencies

```
T001, T002, T003 (sequential — shared deps)
    → T004 → T005 → T006
        → T007 → T008
            → T009
                → T010
                    → T011
                        → T012
```

## Implementation Strategy

### MVP First
1. Phase 1-2: Foundation + Split Terminal/Notes → **basic split view works**
2. STOP and validate
3. Phase 3: Cross-project → **2 projects พร้อมกัน**
4. Phase 4: Drag resize → **ปรับขนาดได้**
5. Phase 5-6: Direction toggle + re-selector
6. Phase 7: Polish
