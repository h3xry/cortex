import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { privateRouter } from "../src/routes/private.js";

vi.mock("../src/services/settings-store.js", () => ({
  hasPassword: vi.fn(),
  getPasswordHash: vi.fn(),
  setPasswordHash: vi.fn(),
}));

vi.mock("../src/services/crypto.js", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

import * as settingsStore from "../src/services/settings-store.js";
import * as crypto from "../src/services/crypto.js";

const mockHasPassword = vi.mocked(settingsStore.hasPassword);
const mockGetPasswordHash = vi.mocked(settingsStore.getPasswordHash);
const mockSetPasswordHash = vi.mocked(settingsStore.setPasswordHash);
const mockHashPassword = vi.mocked(crypto.hashPassword);
const mockVerifyPassword = vi.mocked(crypto.verifyPassword);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/private", privateRouter);
  return app;
}

describe("GET /api/private/status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns hasPassword: false when no password set", async () => {
    mockHasPassword.mockResolvedValue(false);
    const res = await request(createApp()).get("/api/private/status");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ hasPassword: false });
  });

  it("returns hasPassword: true when password exists", async () => {
    mockHasPassword.mockResolvedValue(true);
    const res = await request(createApp()).get("/api/private/status");
    expect(res.body).toEqual({ hasPassword: true });
  });
});

describe("POST /api/private/setup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects short password", async () => {
    const res = await request(createApp())
      .post("/api/private/setup")
      .send({ password: "ab" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least 4/);
  });

  it("sets password for first time", async () => {
    mockGetPasswordHash.mockResolvedValue(null);
    mockHashPassword.mockResolvedValue("salt:hash");
    mockSetPasswordHash.mockResolvedValue(undefined);

    const res = await request(createApp())
      .post("/api/private/setup")
      .send({ password: "test1234" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockSetPasswordHash).toHaveBeenCalledWith("salt:hash");
  });

  it("requires current password when changing", async () => {
    mockGetPasswordHash.mockResolvedValue("existing:hash");

    const res = await request(createApp())
      .post("/api/private/setup")
      .send({ password: "newpass1" });
    expect(res.status).toBe(401);
  });

  it("rejects wrong current password", async () => {
    mockGetPasswordHash.mockResolvedValue("existing:hash");
    mockVerifyPassword.mockResolvedValue(false);

    const res = await request(createApp())
      .post("/api/private/setup")
      .send({ password: "newpass1", currentPassword: "wrong" });
    expect(res.status).toBe(401);
  });

  it("changes password with correct current password", async () => {
    mockGetPasswordHash.mockResolvedValue("existing:hash");
    mockVerifyPassword.mockResolvedValue(true);
    mockHashPassword.mockResolvedValue("new:hash");
    mockSetPasswordHash.mockResolvedValue(undefined);

    const res = await request(createApp())
      .post("/api/private/setup")
      .send({ password: "newpass1", currentPassword: "correct" });
    expect(res.status).toBe(200);
    expect(mockSetPasswordHash).toHaveBeenCalledWith("new:hash");
  });
});

describe("POST /api/private/unlock", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when no password set", async () => {
    mockGetPasswordHash.mockResolvedValue(null);
    const res = await request(createApp())
      .post("/api/private/unlock")
      .send({ password: "test" });
    expect(res.status).toBe(400);
  });

  it("rejects wrong password", async () => {
    mockGetPasswordHash.mockResolvedValue("salt:hash");
    mockVerifyPassword.mockResolvedValue(false);

    const res = await request(createApp())
      .post("/api/private/unlock")
      .send({ password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Incorrect/);
  });

  it("unlocks with correct password", async () => {
    mockGetPasswordHash.mockResolvedValue("salt:hash");
    mockVerifyPassword.mockResolvedValue(true);

    const res = await request(createApp())
      .post("/api/private/unlock")
      .send({ password: "correct" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
