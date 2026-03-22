export class MaxSessionsError extends Error {
  constructor(max: number) {
    super(`Maximum sessions (${max}) reached`);
    this.name = "MaxSessionsError";
  }
}

export class InvalidPathError extends Error {
  constructor(message = "Invalid folder path") {
    super(message);
    this.name = "InvalidPathError";
  }
}

export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Session not found: ${id}`);
    this.name = "SessionNotFoundError";
  }
}
