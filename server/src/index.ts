import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { foldersRouter } from "./routes/folders.js";
import { sessionsRouter } from "./routes/sessions.js";
import { handleWebSocketUpgrade } from "./ws/terminal.js";
import { ALLOWED_ORIGIN, PORT } from "./config.js";

const app = express();
const server = createServer(app);

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "16kb" }));

app.use("/api/folders", foldersRouter);
app.use("/api/sessions", sessionsRouter);

handleWebSocketUpgrade(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
