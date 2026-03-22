import { describe, it, expect } from "vitest";
import {
  MaxSessionsError,
  InvalidPathError,
  SessionNotFoundError,
} from "../src/errors.js";

describe("custom errors", () => {
  it("MaxSessionsError should have correct name and message", () => {
    const err = new MaxSessionsError(10);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MaxSessionsError);
    expect(err.name).toBe("MaxSessionsError");
    expect(err.message).toBe("Maximum sessions (10) reached");
  });

  it("InvalidPathError should have correct name and message", () => {
    const err = new InvalidPathError("test reason");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(InvalidPathError);
    expect(err.name).toBe("InvalidPathError");
    expect(err.message).toBe("test reason");
  });

  it("InvalidPathError should use default message", () => {
    const err = new InvalidPathError();
    expect(err.message).toBe("Invalid folder path");
  });

  it("SessionNotFoundError should have correct name and message", () => {
    const err = new SessionNotFoundError("abc123");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SessionNotFoundError);
    expect(err.name).toBe("SessionNotFoundError");
    expect(err.message).toBe("Session not found: abc123");
  });
});
