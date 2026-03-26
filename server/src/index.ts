import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { foldersRouter } from "./routes/folders.js";
import { sessionsRouter } from "./routes/sessions.js";
import { toolsRouter } from "./routes/tools.js";
import { projectsRouter } from "./routes/projects.js";
import { projectGitRouter } from "./routes/project-git.js";
import { projectFilesRouter } from "./routes/project-files.js";
import { privateRouter } from "./routes/private.js";
import { hooksRouter } from "./routes/hooks.js";
import { noteRouter } from "./routes/notes.js";
import { groupRouter } from "./routes/groups.js";
import { retrosRouter } from "./routes/retros.js";
import { handleWebSocketUpgrade } from "./ws/terminal.js";
import { ALLOWED_ORIGINS, PORT } from "./config.js";
import { reconnectSessions } from "./services/session-manager.js";
import {
  ensureHooksConfigured,
  cleanupOldCommandHooks,
} from "./services/hook-setup.js";

const app = express();
const server = createServer(app);

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: "16kb" }));

app.use("/api/folders", foldersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:id/git", projectGitRouter);
app.use("/api/projects/:id/files", projectFilesRouter);
app.use("/api/private", privateRouter);
app.use("/api/hooks", hooksRouter);
app.use("/api/projects/:id/notes", noteRouter);
app.use("/api/groups", groupRouter);
app.use("/api", retrosRouter);

handleWebSocketUpgrade(server);

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const count = await reconnectSessions();
  if (count > 0) {
    console.log(`Reconnected ${count} existing tmux sessions`);
  }
  await cleanupOldCommandHooks();
  await ensureHooksConfigured();
});
