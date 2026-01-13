import http from "node:http";

const users = [
  { username: "consultant1", password: "1234", role: "Consultant" },
  { username: "champion1", password: "1234", role: "KnowledgeChampion" },
  { username: "admin1", password: "1234", role: "Admin" },
];
const knowledgeItems = [];
let nextKnowledgeId = 1;

const port = Number(process.env.PORT) || 4000;

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
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      let payload = null;
      try {
        payload = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
        return;
      }

      const username = (payload.username || "").trim();
      const password = (payload.password || "").trim();

      if (!username || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Username and password are required" }));
        return;
      }

      const match = users.find(
        (user) => user.username === username && user.password === password
      );

      if (!match) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid username or password" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ username: match.username, role: match.role }));
    });

    return;
  }

  if (req.method === "GET" && req.url === "/api/knowledge") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(knowledgeItems));
    return;
  }

  if (req.method === "GET" && req.url === "/api/leaderboard") {
    const leaderboard = knowledgeItems.reduce((acc, item) => {
      const key = item.author || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(leaderboard));
    return;
  }

  if (req.method === "POST" && req.url === "/api/knowledge") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      let payload = null;
      try {
        payload = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
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
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required fields" }));
        return;
      }

      if (role !== "Consultant") {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Only Consultants can submit knowledge" }));
        return;
      }

      const item = {
        id: nextKnowledgeId++,
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

      knowledgeItems.unshift(item);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Knowledge submitted", item }));
    });

    return;
  }

  if (req.method === "PUT" && req.url.startsWith("/api/validate/")) {
    const id = Number(req.url.split("/").pop());
    if (!Number.isFinite(id)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid knowledge id" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      let payload = null;
      try {
        payload = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON payload" }));
        return;
      }

      const role = (payload.role || "").trim();
      const validator = (payload.validator || "").trim();
      const decision = (payload.decision || "").trim();

      if (!validator || !decision) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Validator and decision are required" }));
        return;
      }

      if (role !== "KnowledgeChampion") {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Only Knowledge Champions can validate" }));
        return;
      }

      const item = knowledgeItems.find((entry) => entry.id === id);
      if (!item) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Knowledge item not found" }));
        return;
      }

      item.status = decision;
      item.validatedBy = validator;
      item.validatedAt = new Date().toISOString();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Validation updated", item }));
    });

    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(port, () => {
  console.log(`Auth server listening on http://localhost:${port}`);
});
