# Research: 004-spec-viewer

**Created:** 2026-03-23

---

## 1. Markdown Renderer

**Decision:** `react-markdown` + `remark-gfm`
**Rationale:** react-markdown เป็น standard React markdown renderer รองรับ GFM (tables, strikethrough, task lists) ผ่าน remark-gfm plugin. รองรับ custom components สำหรับ override code block rendering (ใช้กับ Mermaid). Lightweight.
**Alternatives:**
- marked + dangerouslySetInnerHTML — XSS risk, ไม่ React-native
- MDX — overkill, ต้อง compile
- markdown-it — ไม่ใช่ React component, ต้อง wrap เอง

## 2. Mermaid Renderer

**Decision:** `mermaid` library ใช้ client-side rendering
**Rationale:** Official Mermaid library. เรียก `mermaid.render()` ในcustom code block component เมื่อ language เป็น "mermaid". Render เป็น SVG inline. Error handling ผ่าน try/catch.
**Alternatives:**
- mermaid-react — wrapper แต่ outdated
- Server-side rendering via mermaid CLI — latency สูง, ต้อง install CLI
- External service (mermaid.ink) — ต้องมี internet, privacy concern

## 3. Code Block Syntax Highlighting

**Decision:** Reuse `prism-react-renderer` (already installed)
**Rationale:** ใช้อยู่แล้วใน FileViewer. ใช้เป็น custom component สำหรับ non-mermaid code blocks ใน react-markdown.
**Alternatives:** None — reuse existing

## 4. Spec Directory Listing

**Decision:** Reuse existing `/api/projects/:id/files` endpoint
**Rationale:** ไม่ต้องสร้าง endpoint ใหม่ — เรียก `/files?path=.claude/specs` เพื่อดู feature list, เรียก `/files?path=.claude/specs/001-feature` เพื่อดูไฟล์ใน feature, เรียก `/files/content?path=.claude/specs/001-feature/spec.md` เพื่ออ่าน content.
**Alternatives:**
- New dedicated endpoint — unnecessary duplication
