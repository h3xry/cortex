---
id: 011
title: Cross-Project Retrospective Insights
tags: [retrospective, insights, cross-project]
category: meeting
pinned: true
createdAt: 2026-03-27T08:00:00.000Z
updatedAt: 2026-03-27T08:00:00.000Z
---

# Cross-Project Retrospective Insights

สรุปจาก **48 retrospectives + 22 lessons** ใน 6 projects

## Data Overview

| Project | Retros | Lessons | Period |
|---------|--------|---------|--------|
| cortex | 9 | 3 | Mar 2026 |
| fifa-api | 9 | 5 | Dec 2025 - Jan 2026 |
| falcon-api | 9 | 3 | Dec 2025 - Mar 2026 |
| sell-sync-api | 8 | 4 | Dec 2025 - Jan 2026 |
| bill-agent | 7 | 4 | Dec 2025 - Mar 2026 |
| paphop-api | 6 | 3 | Dec 2025 |

## Top 5 ปัญหาที่เจอบ่อย

### 1. Commit/Push ไม่ถูกขั้นตอน (5+ ครั้ง)
- Commit โดยไม่ได้รอ user พูดว่า "commit"
- Push โดยไม่ pull --rebase ก่อน
- ไม่รัน qqq ก่อน commit

### 2. แก้อาการไม่ใช่สาเหตุ (4+ ครั้ง)
- Metadata lock: แก้ ConnMaxLifetime แต่ root cause คือ FK constraint → กลับมาวันรุ่งขึ้น
- Mermaid flicker: memo child component แต่ปัญหาอยู่ที่ parent polling setState
- WebSocket: trial-and-error แทน systematic debugging

### 3. ไม่ validate UI ก่อน build (3+ ครั้ง)
- Build feature 2+ ชั่วโมงแล้ว revert เพราะ "terrible"
- Project manager ใช้ text input แทน folder picker
- Session manager เป็น sidebar list แทน card grid

### 4. Assume แทนที่จะถาม (ปัญหาบ่อยที่สุด)
- Assume route prefix ไม่อ่าน code
- Assume field meaning ไม่ถาม
- Over-engineering designs ไม่ถาม preference

### 5. Test scope แคบเกินไป (3 ครั้ง)
- qqq test แค่ new package → miss cross-package breaks
- Coupon feature พัง 50+ order tests
- New constructor params พัง downstream test files

## Top 5 สิ่งที่ทำดี

1. **Spec-Kit workflow** ทำงานดีมาก — จัดระเบียบ catch requirements early
2. **qqq catches real issues** — timing attack, path traversal, CORS wildcard, event listener leaks
3. **Root cause analysis เร็ว** เมื่อทำ systematic (37 tmux sessions, metadata lock FK)
4. **Test coverage สูง** — หลาย packages จาก 50% → 80-96%
5. **Fast feedback loops** — 5 rounds feedback ใน 15 นาที

## Key Lessons (Top 10)

1. **Never commit without "commit"** — gogogo + qqq pass ≠ commit
2. **Always `go test ./...`** before commit — package-level tests ไม่พอ
3. **Validate UI 5 นาทีก่อน build** — mockup/wireframe ป้องกัน rewrite
4. **Fix root cause ไม่ใช่ symptom** — ถ้าปัญหากลับมา = แก้ผิดจุด
5. **Study reference code ก่อน** — pixel-agent-desk reference ช่วยประหยัดเวลา
6. **Trace full pipeline** ก่อน debug parts — source → build → serve → display
7. **ถาม "how?" ใน spec** ไม่ใช่แค่ "what?" — UX interaction pattern
8. **New field = grep ALL references** — ทุกไฟล์ที่ import ต้อง update
9. **Polling setState ต้อง compare** ก่อน update — ป้องกัน re-render
10. **Event listeners ใน reconnect = leak** — register ครั้งเดียว

## AI Growth Pattern

| Period | ปัญหาหลัก |
|--------|----------|
| Dec 2025 | Workflow violations — commit ไม่ขออนุญาต, git rules |
| Jan 2026 | Technical issues — import cycles, mock completeness |
| Mar 2026 | Deeper problems — re-render chains, metadata locks, lifecycle |

**Process internalized แล้ว** — ปัญหาเปลี่ยนจาก process → technical depth

## Action Items ที่ยังไม่ได้ทำ

- [ ] Validate UI before building (ยังเกิดซ้ำ Mar 2026)
- [ ] Mock/interface update completeness
- [ ] Separate AutoMigrate from startup (falcon-api)
- [ ] Pre-push hook verify git account
- [ ] Document GORM First() ordering behavior

**Status:** spec created → `.claude/specs/018-retro-viewer/spec.md`
