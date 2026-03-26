# Research: Cross-Project Retrospective Viewer

## File Scanning Approach

**Decision:** Server scans `.claude/memory/retrospective/` and `.claude/memory/lesson/` ของทุก project ที่ register ใน Cortex ตอน API call
**Rationale:** ไม่ต้อง index หรือ persist — scan on-demand เพราะจำนวนไฟล์น้อย (48 retros + 22 lessons) อ่าน fs ตรงเร็วพอ
**Alternatives:**
- Build index + watch for changes (rejected — over-engineering สำหรับ ~70 files)
- SQLite index (rejected — เพิ่ม dependency ไม่จำเป็น)

## Filename Parsing

**Decision:** Parse path structure เป็น metadata
**Format:**
- Retro: `{projectPath}/.claude/memory/retrospective/YYYY-MM-DD/N-HHMM-description.md`
  - date จาก folder name
  - title จาก description part ของ filename (replace `-` with space)
  - order จาก N prefix
- Lesson: `{projectPath}/.claude/memory/lesson/YYYY-MM-DD.md`
  - date จาก filename
**Alternatives:** Parse frontmatter (rejected — retro/lesson files ไม่มี frontmatter, เป็น pure markdown)

## Markdown Rendering

**Decision:** ใช้ existing `MDEditor.Markdown` component + `rehype-raw` ที่มีอยู่แล้วใน Cortex
**Rationale:** NoteViewer ใช้อยู่แล้ว ไม่ต้องเพิ่ม dependency
**Alternatives:** react-markdown (rejected — มีอยู่แล้วแต่ MDEditor.Markdown ดีกว่าสำหรับ dark theme)

## Private Project Handling

**Decision:** Server check unlock token เหมือน API อื่น — retros ของ private project ต้อง unlock ก่อน
**Rationale:** Consistent กับ security model ที่มีอยู่
**Alternatives:** แสดงทุก project (rejected — ละเมิด privacy model)
