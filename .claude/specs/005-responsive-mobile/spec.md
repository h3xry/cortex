# Feature: Responsive Mobile

**ID:** 005-responsive-mobile
**Created:** 2026-03-23
**Status:** Draft

## Problem Statement

หน้าเว็บปัจจุบันออกแบบสำหรับ desktop เท่านั้น — sidebar กับ main content วางข้างกันแบบ fixed width เมื่อเปิดบนมือถือหรือ tablet จอแคบทำให้ใช้งานไม่ได้ sidebar กินพื้นที่ terminal/files แสดงเล็กเกินไป

## User Scenarios & Testing

### User Story 1 - Mobile Layout (Priority: P1)

ผู้ใช้เปิดหน้าเว็บบนมือถือ เห็น layout ที่เหมาะกับจอเล็ก — sidebar ซ่อนอยู่เปิดปิดได้ main content เต็มจอ สามารถใช้งานทุก feature ได้ (projects, terminal, files, changes, specs)

**Why this priority**: ใช้งานไม่ได้เลยบนมือถือถ้าไม่แก้ layout
**Independent Test**: เปิดเว็บบนมือถือ (หรือ resize browser ให้แคบ) → ใช้งานได้ทุก feature

**Acceptance Scenarios**:
1. **Given** จอกว้างน้อยกว่า 768px, **When** เปิดหน้าเว็บ, **Then** sidebar ซ่อนอยู่ มีปุ่ม hamburger เพื่อเปิด
2. **Given** mobile layout, **When** กดปุ่ม hamburger, **Then** sidebar แสดงเป็น overlay ทับ main content
3. **Given** sidebar เปิดอยู่บน mobile, **When** เลือก project, **Then** sidebar ปิดอัตโนมัติ แสดง project panel เต็มจอ
4. **Given** mobile layout, **When** ดู terminal/files/changes/specs, **Then** content แสดงเต็มจอ อ่านได้
5. **Given** จอกว้างมากกว่า 768px, **When** เปิดหน้าเว็บ, **Then** แสดง layout ปกติ (sidebar + main content ข้างกัน)

### User Story 2 - Touch-Friendly UI (Priority: P2)

ปุ่มและ interactive elements มีขนาดใหญ่พอสำหรับนิ้วสัมผัส tab headers อ่านง่าย input fields ใช้งานได้สะดวกบนมือถือ

**Why this priority**: layout ถูกก่อน ค่อย polish touch UX ทีหลัง
**Independent Test**: ใช้นิ้วกดทุกปุ่ม/tab/input ได้โดยไม่ต้อง zoom

**Acceptance Scenarios**:
1. **Given** mobile layout, **When** ดู tab bar (Terminal/Files/Changes/Specs), **Then** tabs มีขนาดใหญ่พอกดได้ (min 44px touch target)
2. **Given** mobile layout, **When** ดู file list หรือ project list, **Then** แต่ละ item มีพื้นที่กดพอ ไม่ชิดกันเกินไป
3. **Given** mobile layout ใน Files/Changes tab, **When** เปิดไฟล์, **Then** file list ซ่อนแสดง content เต็มจอ มีปุ่มกลับ

### Edge Cases
- Tablet landscape (768-1024px) — ควรแสดง sidebar แคบลงหรือซ่อน?
- Terminal input บนมือถือ — virtual keyboard อาจบัง terminal
- Mermaid diagrams บนจอเล็ก — ต้อง scroll horizontal ได้
- Folder picker modal บนมือถือ — ต้อง responsive ด้วย

## Functional Requirements

- **FR-001**: System MUST hide sidebar on screens < 768px and show hamburger menu
- **FR-002**: System MUST show sidebar as overlay when hamburger is clicked
- **FR-003**: System MUST auto-close sidebar after project selection on mobile
- **FR-004**: System MUST display main content full-width on mobile
- **FR-005**: System MUST make all touch targets at least 44px
- **FR-006**: System MUST support split views (Files/Changes) as stacked on mobile — file list on top, content below (or navigate between them)
- **FR-007**: System MUST make folder picker modal responsive
- **FR-008**: System MUST keep desktop layout unchanged for screens >= 768px

## Key Entities

None — CSS-only changes, no new data entities.

## Success Criteria (technology-agnostic, measurable)

- **SC-001**: All features usable on 375px wide screen (iPhone SE) without horizontal scroll on main content
- **SC-002**: All touch targets >= 44px
- **SC-003**: Desktop layout unchanged for screens >= 768px
- **SC-004**: Page loads and is interactive within 3 seconds on mobile

## Out of Scope

- Native mobile app
- PWA (service worker, offline)
- Mobile-specific gestures (swipe to navigate)
- Orientation lock

## Assumptions

- Breakpoint: 768px (standard tablet/mobile threshold)
- CSS media queries only — no JavaScript window.innerWidth checks
- Mobile-first approach not needed — add responsive overrides to existing desktop CSS
- Terminal on mobile is read-only friendly but input may be limited by virtual keyboard
