import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { sessionsRouter } from "../src/routes/sessions.js";
import {
  MaxSessionsError,
  InvalidPathError,
  SessionNotFoundError,
} from "../src/errors.js";

vi.mock("../src/services/session-manager.js", () => ({
  createSession: vi.fn(),
  listSessions: vi.fn().mockReturnValue([]),
  deleteSession: vi.fn(),
}));

import * as sessionManager from "../src/services/session-manager.js";

const mockedCreateSession = vi.mocked(sessionManager.createSession);
const mockedListSessions = vi.mocked(sessionManager.listSessions);
const mockedDeleteSession = vi.mocked(sessionManager.deleteSession);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/sessions", sessionsRouter);
  return app;
}

describe("POST /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 with session on success", async () => {
    const session = {
      id: "abc12345",
      tmuxSessionName: "cc-abc12345",
      folderPath: "/home/user/project",
      status: "running" as const,
      createdAt: "2026-03-23T10:00:00Z",
      endedAt: null,
    };
    mockedCreateSession.mockResolvedValue(session);

    const res = await request(createApp())
      .post("/api/sessions")
      .send({ folderPath: "/home/user/project" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("abc12345");
    expect(res.body.folderPath).toBe("/home/user/project");
    expect(res.body.status).toBe("running");
    expect(res.body.endedAt).toBeNull();
  });

  it("should return 400 when folderPath is missing", async () => {
    const res = await request(createApp())
      .post("/api/sessions")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("folderPath or projectId is required");
  });

  it("should return 400 on InvalidPathError", async () => {
    mockedCreateSession.mockRejectedValue(
      new InvalidPathError("Folder does not exist"),
    );

    const res = await request(createApp())
      .post("/api/sessions")
      .send({ folderPath: "/nonexistent" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Folder does not exist");
  });

  it("should return 409 on MaxSessionsError", async () => {
    mockedCreateSession.mockRejectedValue(new MaxSessionsError(10));

    const res = await request(createApp())
      .post("/api/sessions")
      .send({ folderPath: "/tmp" });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("Maximum sessions");
  });

  it("should return 500 with generic message on unknown error", async () => {
    mockedCreateSession.mockRejectedValue(new Error("secret internal detail"));

    const res = await request(createApp())
      .post("/api/sessions")
      .send({ folderPath: "/tmp" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
    expect(res.body.error).not.toContain("secret");
  });
});

describe("GET /api/sessions", () => {
  it("should return list of sessions", async () => {
    mockedListSessions.mockReturnValue([
      {
        id: "abc",
        tmuxSessionName: "cc-abc",
        folderPath: "/tmp",
        status: "running",
        createdAt: "2026-03-23T10:00:00Z",
        endedAt: null,
      },
    ]);

    const res = await request(createApp()).get("/api/sessions");

    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions[0].id).toBe("abc");
    expect(res.body.sessions[0].endedAt).toBeNull();
  });
});

describe("DELETE /api/sessions/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 on success", async () => {
    mockedDeleteSession.mockResolvedValue({
      id: "abc",
      tmuxSessionName: "cc-abc",
      folderPath: "/tmp",
      status: "ended",
      createdAt: "2026-03-23T10:00:00Z",
      endedAt: "2026-03-23T10:05:00Z",
    });

    const res = await request(createApp()).delete("/api/sessions/abc");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("abc");
    expect(res.body.status).toBe("ended");
  });

  it("should return 404 on SessionNotFoundError", async () => {
    mockedDeleteSession.mockRejectedValue(
      new SessionNotFoundError("notfound"),
    );

    const res = await request(createApp()).delete("/api/sessions/notfound");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Session not found");
  });

  it("should return 500 with generic message on unknown error", async () => {
    mockedDeleteSession.mockRejectedValue(new Error("tmux crashed"));

    const res = await request(createApp()).delete("/api/sessions/abc");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal server error");
  });
});
