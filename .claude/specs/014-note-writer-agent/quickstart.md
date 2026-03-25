# Quickstart: Note Writer Agent

## Validation Scenarios

### Scenario 1: Topic Only (Clarify Flow)
```
User: /note meeting note จากวันนี้
Agent: ถามคำถาม batch →
  1. Meeting นี้เกี่ยวกับอะไร?
  2. ใครเข้าร่วมบ้าง?
  3. มี action items อะไรบ้าง?
  4. Note นี้ใครจะอ่าน?
  5. ต้องการรูปแบบไหน? (สรุปสั้น / รายละเอียดครบ)
User: ตอบคำถาม
Agent: สรุป key points → ถาม confirm
User: ok
Agent: แสดง formatted meeting note
```

### Scenario 2: Raw Info (Summarize Flow)
```
User: /note จด decision log:
  เราเลือก PostgreSQL แทน MongoDB เพราะต้องการ ACID
  ทีม backend เห็นด้วย แต่ทีม data อยากได้ MongoDB
  สุดท้ายเลือก PG เพราะ existing infra
Agent: สรุป key points →
  - Decision: เลือก PostgreSQL แทน MongoDB
  - เหตุผล: ACID compliance + existing infrastructure
  - ข้อเสีย: ทีม data prefer MongoDB
  ถูกต้องไหม?
User: เพิ่ม timeline ด้วย — migrate ภายใน Q2
Agent: สรุปใหม่พร้อม timeline → ถาม confirm
User: ok
Agent: แสดง formatted decision log
```

### Scenario 3: Skip Clarify
```
User: /note ไม่ต้องถาม เขียนเลย — idea: ทำ caching layer ด้วย Redis
Agent: (ข้ามขั้น clarify) → format เป็น idea note ทันที
```

### Scenario 4: Save to File
```
User: /note meeting note (ผ่าน flow ปกติ)
Agent: แสดง note → ถาม: แสดงอย่างเดียว หรือ save เป็นไฟล์?
User: save ไปที่ ./notes/meeting-2026-03-25.md
Agent: เขียนไฟล์ → ยืนยัน path
```

## Expected Output Quality

- Markdown headings (`#`, `##`) สำหรับ sections
- Bullet points สำหรับ lists
- **Bold** สำหรับ key terms
- Code blocks สำหรับ technical content
- อ่านได้ทั้ง raw text และ rendered
