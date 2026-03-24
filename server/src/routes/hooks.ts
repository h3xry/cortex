import { Router } from "express";
import { processHookEvent } from "../services/session-activity.js";

export const hooksRouter = Router();

hooksRouter.post("/", (req, res) => {
  try {
    const data = req.body;

    if (!data || !data.hook_event_name) {
      res.status(400).json({ error: "Invalid hook event" });
      return;
    }

    // Pass raw hook data — processor handles all field mapping
    processHookEvent(data);

    res.json({ ok: true });
  } catch (err) {
    console.error("[hooks] Error processing:", err);
    res.status(500).json({ error: "Failed to process hook" });
  }
});
