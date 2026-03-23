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
  getSession: vi.fn(),
  getLastOutput: vi.fn().mockReturnValue(""),
  removeSession: vi.fn(),
}));

vi.mock("../src/services/project-store.js", () => ({
  listProjects: vi.fn().mockResolvedValue([]),
  getProject: vi.fn(),
}));

import * as sessionManager from "../src/services/session-manager.js";
import * as projectStore from "../src/services/project-store.js";

const mockedCreateSession = vi.mocked(sessionManager.createSession);
const mockedListSessions = vi.mocked(sessionManager.listSessions);
const mockedDeleteSession = vi.mocked(sessionManager.deleteSession);
const mockedGetSession = vi.mocked(sessionManager.getSession);
const mockedGetLastOutput = vi.mocked(sessionManager.getLastOutput);
const mockedRemoveSession = vi.mocked(sessionManager.removeSession);
const mockedListProjects = vi.mocked(projectStore.listProjects);

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
  beforeEach(() => vi.clearAllMocks());

  it("should return sessions with projectName and lastOutput", async () => {
    mockedListSessions.mockReturnValue([
      {
        id: "abc",
        tmuxSessionName: "cc-abc",
        folderPath: "/tmp/my-project",
        status: "running",
        createdAt: "2026-03-23T10:00:00Z",
        endedAt: null,
      },
    ]);
    mockedListProjects.mockResolvedValue([
      { id: "p1", name: "my-project", path: "/tmp/my-project", isGitRepo: false, addedAt: "2026-01-01", isPrivate: false },
    ]);
    mockedGetLastOutput.mockReturnValue("Compiling...");

    const res = await request(createApp()).get("/api/sessions");

    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions[0].projectName).toBe("my-project");
    expect(res.body.sessions[0].lastOutput).toBe("Compiling...");
  });

  it("should return null projectName when no matching project", async () => {
    mockedListSessions.mockReturnValue([
      {
        id: "abc",
        tmuxSessionName: "cc-abc",
        folderPath: "/tmp/unknown",
        status: "running",
        createdAt: "2026-03-23T10:00:00Z",
        endedAt: null,
      },
    ]);
    mockedListProjects.mockResolvedValue([]);
    mockedGetLastOutput.mockReturnValue("");

    const res = await request(createApp()).get("/api/sessions");

    expect(res.body.sessions[0].projectName).toBeNull();
  });
});

describe("DELETE /api/sessions/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should kill running session and remove", async () => {
    mockedGetSession.mockReturnValue({
      id: "abc",
      tmuxSessionName: "cc-abc",
      folderPath: "/tmp",
      status: "running",
      createdAt: "2026-03-23T10:00:00Z",
      endedAt: null,
    });
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
    expect(res.body.status).toBe("ended");
    expect(mockedDeleteSession).toHaveBeenCalledWith("abc");
    expect(mockedRemoveSession).toHaveBeenCalledWith("abc");
  });

  it("should remove ended session without killing", async () => {
    mockedGetSession.mockReturnValue({
      id: "abc",
      tmuxSessionName: "cc-abc",
      folderPath: "/tmp",
      status: "ended",
      createdAt: "2026-03-23T10:00:00Z",
      endedAt: "2026-03-23T10:05:00Z",
    });

    const res = await request(createApp()).delete("/api/sessions/abc");

    expect(res.status).toBe(200);
    expect(mockedDeleteSession).not.toHaveBeenCalled();
    expect(mockedRemoveSession).toHaveBeenCalledWith("abc");
  });

  it("should return 404 for non-existent session", async () => {
    mockedGetSession.mockReturnValue(undefined);

    const res = await request(createApp()).delete("/api/sessions/notfound");

    expect(res.status).toBe(404);
  });
});
