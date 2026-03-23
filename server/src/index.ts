import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { foldersRouter } from "./routes/folders.js";
import { sessionsRouter } from "./routes/sessions.js";
import { toolsRouter } from "./routes/tools.js";
import { projectsRouter } from "./routes/projects.js";
import { projectGitRouter } from "./routes/project-git.js";
import { projectFilesRouter } from "./routes/project-files.js";
import { handleWebSocketUpgrade } from "./ws/terminal.js";
import { ALLOWED_ORIGINS, PORT } from "./config.js";

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

handleWebSocketUpgrade(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
