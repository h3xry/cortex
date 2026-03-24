import { Router } from "express";
import { hashPassword, verifyPassword } from "../services/crypto.js";
import * as settingsStore from "../services/settings-store.js";
import { addToken, removeToken } from "../services/unlock-store.js";

export const privateRouter = Router();

// GET /api/private/status
privateRouter.get("/status", async (_req, res) => {
  try {
    const has = await settingsStore.hasPassword();
    res.json({ hasPassword: has });
  } catch (err) {
    console.error("Private status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/private/setup
privateRouter.post("/setup", async (req, res) => {
  try {
    const { password, currentPassword } = req.body;

    if (!password || typeof password !== "string" || password.length < 4) {
      res.status(400).json({ error: "Password must be at least 4 characters" });
      return;
    }

    const existingHash = await settingsStore.getPasswordHash();

    // If password already exists, require current password
    if (existingHash) {
      if (!currentPassword || typeof currentPassword !== "string") {
        res.status(401).json({ error: "Current password is required" });
        return;
      }
      const valid = await verifyPassword(currentPassword, existingHash);
      if (!valid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
    }

    const hash = await hashPassword(password);
    await settingsStore.setPasswordHash(hash);
    res.json({ ok: true });
  } catch (err) {
    console.error("Private setup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/private/unlock
privateRouter.post("/unlock", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== "string") {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const hash = await settingsStore.getPasswordHash();
    if (!hash) {
      res.status(400).json({ error: "No private password set" });
      return;
    }

    const valid = await verifyPassword(password, hash);
    if (!valid) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    const token = addToken();
    res.json({ ok: true, token });
  } catch (err) {
    console.error("Private unlock error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/private/lock
privateRouter.post("/lock", (req, res) => {
  const token = req.headers["x-unlock-token"];
  if (typeof token === "string") {
    removeToken(token);
  }
  res.json({ ok: true });
});
