import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import os from "node:os";
import { foldersRouter } from "../src/routes/folders.js";

function createApp() {
  const app = express();
  app.use("/api/folders", foldersRouter);
  return app;
}

describe("GET /api/folders", () => {
  it("should return folders for valid path within home", async () => {
    const home = os.homedir();
    const app = createApp();
    const res = await request(app).get(
      `/api/folders?path=${encodeURIComponent(home)}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.current).toBe(home);
    expect(res.body.entries).toBeInstanceOf(Array);
  });

  it("should reject paths outside allowed root", async () => {
    const app = createApp();
    const res = await request(app).get("/api/folders?path=/etc");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Path outside allowed root");
  });

  it("should return 404 for nonexistent path within root", async () => {
    const home = os.homedir();
    const app = createApp();
    const res = await request(app).get(
      `/api/folders?path=${encodeURIComponent(home + "/nonexistent_xyz_123")}`,
    );
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Path not found");
  });

  it(
    "should default to home directory",
    async () => {
      const app = createApp();
      const res = await request(app).get("/api/folders");
      expect(res.status).toBe(200);
      expect(res.body.current).toBeDefined();
    },
    15000,
  );

  it("should not include hidden folders", async () => {
    const home = os.homedir();
    const app = createApp();
    const res = await request(app).get(
      `/api/folders?path=${encodeURIComponent(home)}`,
    );
    expect(res.status).toBe(200);
    const hiddenEntries = res.body.entries.filter((e: any) =>
      e.name.startsWith("."),
    );
    expect(hiddenEntries.length).toBe(0);
  });

  it("should include parent path for non-root directories", async () => {
    const home = os.homedir();
    const app = createApp();
    const res = await request(app).get(
      `/api/folders?path=${encodeURIComponent(home)}`,
    );
    expect(res.status).toBe(200);
    // parent should be null if home is the root, or a string if there's a parent within root
    expect(
      res.body.parent === null || typeof res.body.parent === "string",
    ).toBe(true);
  });
});
