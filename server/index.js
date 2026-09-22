import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const messagesFile = path.join(dataDir, "messages.json");
const contentFile = path.join(dataDir, "content.json");
const port = Number(process.env.PORT || 5000);
const adminPassword = process.env.ADMIN_PASSWORD || "change-me-before-publishing";

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function isAdmin(req) {
  return req.headers.cookie?.includes("admin_session=authenticated");
}

const app = express();
app.use(express.json({ limit: "100kb" }));

app.get("/api/content", async (_req, res) => {
  res.json(await readJson(contentFile, {}));
});

app.get("/api/media", async (_req, res) => {
  const content = await readJson(contentFile, {});
  res.json(content.media || []);
});

app.post("/api/messages", async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }
  const messages = await readJson(messagesFile, []);
  const entry = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim(),
    subject: subject?.trim() || "General inquiry",
    message: message.trim(),
    status: "unread",
    createdAt: new Date().toISOString()
  };
  messages.unshift(entry);
  await writeJson(messagesFile, messages);
  res.status(201).json({ message: "Your message was saved.", entry: { id: entry.id } });
});

app.post("/api/admin/login", (req, res) => {
  if (req.body?.password !== adminPassword) {
    return res.status(401).json({ error: "Incorrect password." });
  }
  res.setHeader("Set-Cookie", "admin_session=authenticated; HttpOnly; SameSite=Lax; Path=/");
  res.json({ authenticated: true });
});

app.post("/api/admin/logout", (_req, res) => {
  res.setHeader("Set-Cookie", "admin_session=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/");
  res.json({ authenticated: false });
});

app.get("/api/admin/messages", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Admin login required." });
  res.json(await readJson(messagesFile, []));
});

app.patch("/api/admin/messages/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Admin login required." });
  const messages = await readJson(messagesFile, []);
  const index = messages.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Message not found." });
  messages[index].status = req.body?.status === "read" ? "read" : "unread";
  await writeJson(messagesFile, messages);
  res.json(messages[index]);
});

app.delete("/api/admin/messages/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Admin login required." });
  const messages = await readJson(messagesFile, []);
  const remaining = messages.filter((item) => item.id !== req.params.id);
  if (remaining.length === messages.length) return res.status(404).json({ error: "Message not found." });
  await writeJson(messagesFile, remaining);
  res.status(204).end();
});

app.get("/api/admin/stats", async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ error: "Admin login required." });
  const messages = await readJson(messagesFile, []);
  const unread = messages.filter((item) => item.status === "unread").length;
  res.json({
    totalMessages: messages.length,
    unreadMessages: unread,
    mediaItems: (await readJson(contentFile, {})).media?.length || 0,
    chart: messages.slice(0, 7).reverse().map((item) => ({ label: item.createdAt.slice(5, 10), value: 1 }))
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(rootDir, "dist")));
  app.get("*", (_req, res) => res.sendFile(path.join(rootDir, "dist", "index.html")));
} else {
  const vite = await createViteServer({
    root: rootDir,
    server: { middlewareMode: true, host: "0.0.0.0" },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Mason Rhine website running on port ${port}`);
});