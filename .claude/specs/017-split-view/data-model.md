# Data Model: Split View

## SplitState (in-memory, App.tsx)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| splitMode | boolean | false | Split on/off |
| splitDirection | "h" \| "v" | "h" | horizontal / vertical |
| splitRatio | number | 0.5 | 0.2 - 0.8 |
| rightProject | Project \| null | null | Project ใน panel ขวา |
| focusedPanel | "left" \| "right" | "left" | Panel ที่ active |

## PanelConfig

| Field | Type | Description |
|-------|------|-------------|
| project | Project | Project ที่แสดง |
| isFocused | boolean | Panel นี้ active อยู่ไหม |
| isSplitMode | boolean | อยู่ใน split mode ไหม (สำหรับ compact UI) |

## Constraints

- ratio clamped to 0.2 - 0.8 (min 20% per panel)
- Split hidden on mobile (< 768px)
- Split state ไม่ persist ข้าม refresh
- Left panel = primary (เก็บเมื่อปิด split)
