---
id: 005
title: Notification & Alert System
tags: [idea, notification, session]
category: done
pinned: false
createdAt: 2026-03-25T12:00:00.000Z
updatedAt: 2026-03-25T13:00:00.000Z
---

แจ้งเตือนเมื่อเกิด event สำคัญ

- session จบ (สำเร็จ/error) → browser notification + sound
- session ถาม input (รอ user ตอบ) → alert
- git conflict detected → warning
- long-running session (> 10 min) → reminder
- ใช้ Web Notification API + PWA push
- ตั้ง rules ได้ เช่น "แจ้งเมื่อ project X จบ"

ตอนนี้ต้องเปิดดูเองว่า session จบหรือยัง — ไม่มี push

**Status:** spec created → `.claude/specs/015-notification-system/spec.md`
