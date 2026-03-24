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

vi.mock("../src/services/group-store.js", () => ({
  getPrivateGroupIds: vi.fn().mockResolvedValue(new Set()),
}));

vi.mock("../src/services/unlock-store.js", () => ({
  isUnlockedHeader: vi.fn(),
}));

vi.mock("../src/services/session-activity.js", () => ({
  getActivityByFolderPath: vi.fn().mockReturnValue(null),
}));

import * as sessionManager from "../src/services/session-manager.js";
import * as projectStore from "../src/services/project-store.js";
import * as groupStore from "../src/services/group-store.js";
import * as unlockStore from "../src/services/unlock-store.js";

const mockedCreateSession = vi.mocked(sessionManager.createSession);
const mockedListSessions = vi.mocked(sessionManager.listSessions);
const mockedDeleteSession = vi.mocked(sessionManager.deleteSession);
const mockedGetSession = vi.mocked(sessionManager.getSession);
const mockedGetLastOutput = vi.mocked(sessionManager.getLastOutput);
const mockedRemoveSession = vi.mocked(sessionManager.removeSession);
const mockedListProjects = vi.mocked(projectStore.listProjects);
const mockedGetPrivateGroupIds = vi.mocked(groupStore.getPrivateGroupIds);
const mockedGetProject = vi.mocked(projectStore.getProject);
const mockedIsUnlockedHeader = vi.mocked(unlockStore.isUnlockedHeader);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/sessions", sessionsRouter);
  return app;
}

describe("POST /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedIsUnlockedHeader.mockReturnValue(false);
    mockedGetPrivateGroupIds.mockResolvedValue(new Set());
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

  it("should reject 403 when folderPath matches private project", async () => {
    mockedGetPrivateGroupIds.mockResolvedValue(new Set(["g-private"]));
    mockedListProjects.mockResolvedValue([
      { id: "s1", name: "secret", path: "/tmp/secret", isGitRepo: false, addedAt: "2026-01-01", groupId: "g-private" },
    ]);

    const res = await request(createApp())
      .post("/api/sessions")
      .send({ folderPath: "/tmp/secret" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Project is private");
  });

  it("should reject 403 when projectId resolves to private project path", async () => {
    mockedGetProject.mockResolvedValue({
      id: "priv1", name: "secret", path: "/tmp/secret",
      isGitRepo: false, addedAt: "2026-01-01", isPrivate: true,
    });
    mockedGetPrivateGroupIds.mockResolvedValue(new Set(["g-private"]));
    mockedListProjects.mockResolvedValue([
      { id: "s1", name: "secret", path: "/tmp/secret", isGitRepo: false, addedAt: "2026-01-01", groupId: "g-private" },
    ]);

    const res = await request(createApp())
      .post("/api/sessions")
      .send({ projectId: "priv1" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Project is private");
  });

  it("should allow private project session when unlocked", async () => {
    mockedIsUnlockedHeader.mockReturnValue(true);
    const session = {
      id: "abc12345",
      tmuxSessionName: "cc-abc12345",
      folderPath: "/tmp/secret",
      status: "running" as const,
      createdAt: "2026-03-23T10:00:00Z",
      endedAt: null,
    };
    mockedCreateSession.mockResolvedValue(session);

    const res = await request(createApp())
      .post("/api/sessions")
      .send({ folderPath: "/tmp/secret" });

    expect(res.status).toBe(201);
  });
});

describe("GET /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedIsUnlockedHeader.mockReturnValue(false);
    mockedGetPrivateGroupIds.mockResolvedValue(new Set());
  });

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

  it("should filter out sessions of private projects when locked", async () => {
    mockedGetPrivateGroupIds.mockResolvedValue(new Set(["g-private"]));
    mockedListProjects.mockResolvedValue([
      { id: "s1", name: "secret", path: "/tmp/secret", isGitRepo: false, addedAt: "2026-01-01", groupId: "g-private" },
    ]);
    mockedListSessions.mockReturnValue([
      {
        id: "pub-sess",
        tmuxSessionName: "cc-pub",
        folderPath: "/tmp/public",
        status: "running",
        createdAt: "2026-03-23T10:00:00Z",
        endedAt: null,
      },
      {
        id: "priv-sess",
        tmuxSessionName: "cc-priv",
        folderPath: "/tmp/secret",
        status: "running",
        createdAt: "2026-03-23T10:00:00Z",
        endedAt: null,
      },
    ]);
    mockedGetLastOutput.mockReturnValue("");

    const res = await request(createApp()).get("/api/sessions");

    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions[0].id).toBe("pub-sess");
  });

  it("should show all sessions when unlocked", async () => {
    mockedIsUnlockedHeader.mockReturnValue(true);
    mockedListSessions.mockReturnValue([
      {
        id: "pub-sess",
        tmuxSessionName: "cc-pub",
        folderPath: "/tmp/public",
        status: "running",
        createdAt: "2026-03-23T10:00:00Z",
        endedAt: null,
      },
      {
        id: "priv-sess",
        tmuxSessionName: "cc-priv",
        folderPath: "/tmp/secret",
        status: "running",
        createdAt: "2026-03-23T10:00:00Z",
        endedAt: null,
      },
    ]);
    mockedListProjects.mockResolvedValue([]);
    mockedGetLastOutput.mockReturnValue("");

    const res = await request(createApp()).get("/api/sessions");

    expect(res.body.sessions).toHaveLength(2);
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
