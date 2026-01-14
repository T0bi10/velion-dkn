import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const seedUsers = [
  { username: "consultant1", password: "1234", role: "Consultant" },
  { username: "champion1", password: "1234", role: "KnowledgeChampion" },
  { username: "admin1", password: "1234", role: "Admin" },
];

const port = Number(process.env.PORT) || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = process.env.DATA_FILE || path.join(__dirname, "data.json");

const defaultStore = () => ({
  users: [],
  knowledge: [],
});

const loadStore = async () => {
  try {
    const raw = await fs.readFile(dataFile, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      knowledge: Array.isArray(parsed.knowledge) ? parsed.knowledge : [],
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return defaultStore();
    }
    throw error;
  }
};

const saveStore = async (store) => {
  const payload = JSON.stringify(store, null, 2);
  await fs.writeFile(dataFile, payload, "utf-8");
};

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const readRequestJson = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

const sendJson = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const serializeKnowledge = (item) => {
  if (!item) return null;
  const { id, ...rest } = item;
  return { id, ...rest };
};

const ensureSeedUsers = (store) => {
  if (store.users.length > 0) return;
  store.users = seedUsers.map((user) => ({
    ...user,
    status: "Approved",
    createdAt: new Date().toISOString(),
  }));
};

const generateId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const startServer = async () => {
  const store = await loadStore();
  ensureSeedUsers(store);
  await saveStore(store);

  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/api/login") {
      let payload = null;
      try {
        payload = await readRequestJson(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload" });
        return;
      }

      const username = (payload.username || "").trim();
      const password = (payload.password || "").trim();

      if (!username || !password) {
        sendJson(res, 400, { error: "Username and password are required" });
        return;
      }

      try {
        const match = store.users.find(
          (user) => user.username === username && user.password === password
        );
        if (!match) {
          sendJson(res, 401, { error: "Invalid username or password" });
          return;
        }

        sendJson(res, 200, { username: match.username, role: match.role });
      } catch (error) {
        sendJson(res, 500, { error: "Login failed" });
      }

      return;
    }

    if (req.method === "POST" && req.url === "/api/signup") {
      let payload = null;
      try {
        payload = await readRequestJson(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload" });
        return;
      }

      const username = (payload.username || "").trim();
      const password = (payload.password || "").trim();
      const region = (payload.region || "").trim();
      const requestedRole = (payload.requestedRole || "Consultant").trim();

      if (!username || !password) {
        sendJson(res, 400, { error: "Enter both username and password." });
        return;
      }

      if (!region) {
        sendJson(res, 400, { error: "Select a region." });
        return;
      }

      if (username.length < 3) {
        sendJson(res, 400, { error: "Username must be at least 3 characters." });
        return;
      }

      if (password.length < 4) {
        sendJson(res, 400, { error: "Password must be at least 4 characters." });
        return;
      }

      try {
        const existing = store.users.find((user) => user.username === username);
        if (existing) {
          sendJson(res, 409, { error: "Username already exists." });
          return;
        }

        const user = {
          username,
          password,
          role: "Consultant",
          requestedRole,
          region,
          status: "Pending",
          createdAt: new Date().toISOString(),
        };

        store.users.push(user);
        await saveStore(store);
        sendJson(res, 201, { message: "Signup submitted", user: sanitizeUser(user) });
      } catch (error) {
        sendJson(res, 500, { error: "Signup failed" });
      }

      return;
    }

    if (req.method === "GET" && req.url === "/api/admin/requests") {
      const role = (req.headers["x-user-role"] || "").trim();
      if (role !== "Admin") {
        sendJson(res, 403, { error: "Admin access required" });
        return;
      }

      try {
        const pendingUsers = store.users
          .filter((user) => user.status === "Pending")
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        sendJson(res, 200, pendingUsers.map(sanitizeUser));
      } catch (error) {
        sendJson(res, 500, { error: "Failed to load user requests" });
      }
      return;
    }

    if (req.method === "PUT" && req.url === "/api/admin/requests/approve") {
      let payload = null;
      try {
        payload = await readRequestJson(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload" });
        return;
      }

      const role = (payload.role || "").trim();
      const username = (payload.username || "").trim();

      if (role !== "Admin") {
        sendJson(res, 403, { error: "Admin access required" });
        return;
      }

      if (!username) {
        sendJson(res, 400, { error: "Username is required" });
        return;
      }

      try {
        const target = store.users.find((user) => user.username === username);
        if (!target) {
          sendJson(res, 404, { error: "User not found" });
          return;
        }

        target.role = target.requestedRole || target.role;
        target.status = "Approved";
        await saveStore(store);
        sendJson(res, 200, { message: "User approved", user: sanitizeUser(target) });
      } catch (error) {
        sendJson(res, 500, { error: "Failed to approve user" });
      }

      return;
    }

    if (req.method === "PUT" && req.url === "/api/admin/requests/reject") {
      let payload = null;
      try {
        payload = await readRequestJson(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload" });
        return;
      }

      const role = (payload.role || "").trim();
      const username = (payload.username || "").trim();

      if (role !== "Admin") {
        sendJson(res, 403, { error: "Admin access required" });
        return;
      }

      if (!username) {
        sendJson(res, 400, { error: "Username is required" });
        return;
      }

      try {
        const index = store.users.findIndex((user) => user.username === username);
        if (index === -1) {
          sendJson(res, 404, { error: "User not found" });
          return;
        }
        const [removed] = store.users.splice(index, 1);
        await saveStore(store);
        sendJson(res, 200, { message: "User rejected", user: sanitizeUser(removed) });
      } catch (error) {
        sendJson(res, 500, { error: "Failed to reject user" });
      }

      return;
    }

    if (req.method === "GET" && req.url === "/api/knowledge") {
      try {
        const items = store.knowledge
          .slice()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        sendJson(res, 200, items.map(serializeKnowledge));
      } catch (error) {
        sendJson(res, 500, { error: "Failed to load knowledge" });
      }
      return;
    }

    if (req.method === "GET" && req.url === "/api/leaderboard") {
      try {
        const leaderboard = store.knowledge.reduce((acc, item) => {
          const key = item.author || "unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        sendJson(res, 200, leaderboard);
      } catch (error) {
        sendJson(res, 500, { error: "Failed to load leaderboard" });
      }
      return;
    }

    if (req.method === "POST" && req.url === "/api/knowledge") {
      let payload = null;
      try {
        payload = await readRequestJson(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload" });
        return;
      }

      const title = (payload.title || "").trim();
      const description = (payload.description || "").trim();
      const author = (payload.author || "").trim();
      const role = (payload.role || "").trim();
      const tags = normalizeTags(payload.tags);
      const project = (payload.project || "").trim();
      const region = (payload.region || "").trim();
      const type = (payload.type || "").trim();

      if (!title || !description || !author || !role) {
        sendJson(res, 400, { error: "Missing required fields" });
        return;
      }

      if (role !== "Consultant") {
        sendJson(res, 403, { error: "Only Consultants can submit knowledge" });
        return;
      }

      const item = {
        id: generateId(),
        title,
        description,
        author,
        role,
        tags,
        project,
        region,
        type,
        status: "Pending Validation",
        createdAt: new Date().toISOString(),
      };

      try {
        store.knowledge.push(item);
        await saveStore(store);
        const saved = serializeKnowledge(item);
        sendJson(res, 201, { message: "Knowledge submitted", item: saved });
      } catch (error) {
        sendJson(res, 500, { error: "Failed to submit knowledge" });
      }

      return;
    }

    if (req.method === "PUT" && req.url.startsWith("/api/validate/")) {
      const id = req.url.split("/").pop();
      if (!id) {
        sendJson(res, 400, { error: "Invalid knowledge id" });
        return;
      }

      let payload = null;
      try {
        payload = await readRequestJson(req);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON payload" });
        return;
      }

      const role = (payload.role || "").trim();
      const validator = (payload.validator || "").trim();
      const decision = (payload.decision || "").trim();

      if (!validator || !decision) {
        sendJson(res, 400, { error: "Validator and decision are required" });
        return;
      }

      if (role !== "KnowledgeChampion") {
        sendJson(res, 403, { error: "Only Knowledge Champions can validate" });
        return;
      }

      try {
        const target = store.knowledge.find((item) => item.id === id);
        if (!target) {
          sendJson(res, 404, { error: "Knowledge item not found" });
          return;
        }

        target.status = decision;
        target.validatedBy = validator;
        target.validatedAt = new Date().toISOString();
        await saveStore(store);
        sendJson(res, 200, {
          message: "Validation updated",
          item: serializeKnowledge(target),
        });
      } catch (error) {
        sendJson(res, 500, { error: "Failed to update validation" });
      }

      return;
    }

    sendJson(res, 404, { error: "Not found" });
  });

  server.listen(port, () => {
    console.log(`Auth server listening on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
