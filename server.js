import http from "node:http";
import { MongoClient, ObjectId } from "mongodb";

const seedUsers = [
  { username: "consultant1", password: "1234", role: "Consultant" },
  { username: "champion1", password: "1234", role: "KnowledgeChampion" },
  { username: "admin1", password: "1234", role: "Admin" },
];

const port = Number(process.env.PORT) || 4000;
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const mongoDbName = process.env.MONGODB_DB || "velionDB";
const usersCollectionName = process.env.MONGODB_USERS_COLLECTION || "users";
const knowledgeCollectionName =
  process.env.MONGODB_KNOWLEDGE_COLLECTION || "knowledge_submissions";

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

const serializeKnowledge = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

const ensureSeedUsers = async (usersCollection) => {
  const count = await usersCollection.countDocuments();
  if (count > 0) return;
  await usersCollection.insertMany(seedUsers);
};

const startServer = async () => {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(mongoDbName);
  const usersCollection = db.collection(usersCollectionName);
  const knowledgeCollection = db.collection(knowledgeCollectionName);

  await ensureSeedUsers(usersCollection);

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
        const match = await usersCollection.findOne({ username, password });
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
        const existing = await usersCollection.findOne({ username });
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
          createdAt: new Date(),
        };

        await usersCollection.insertOne(user);
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
        const pendingUsers = await usersCollection
          .find({ status: "Pending" })
          .project({ password: 0 })
          .sort({ createdAt: 1 })
          .toArray();
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
        const result = await usersCollection.findOneAndUpdate(
          { username },
          [
            {
              $set: {
                role: { $ifNull: ["$requestedRole", "$role"] },
                status: "Approved",
              },
            },
          ],
          { returnDocument: "after" }
        );

        if (!result.value) {
          sendJson(res, 404, { error: "User not found" });
          return;
        }

        sendJson(res, 200, { message: "User approved", user: sanitizeUser(result.value) });
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
        const result = await usersCollection.findOneAndDelete({ username });
        if (!result.value) {
          sendJson(res, 404, { error: "User not found" });
          return;
        }
        sendJson(res, 200, { message: "User rejected", user: sanitizeUser(result.value) });
      } catch (error) {
        sendJson(res, 500, { error: "Failed to reject user" });
      }

      return;
    }

    if (req.method === "GET" && req.url === "/api/knowledge") {
      try {
        const items = await knowledgeCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        sendJson(res, 200, items.map(serializeKnowledge));
      } catch (error) {
        sendJson(res, 500, { error: "Failed to load knowledge" });
      }
      return;
    }

    if (req.method === "GET" && req.url === "/api/leaderboard") {
      try {
        const entries = await knowledgeCollection
          .aggregate([{ $group: { _id: "$author", count: { $sum: 1 } } }])
          .toArray();
        const leaderboard = entries.reduce((acc, entry) => {
          const key = entry._id || "unknown";
          acc[key] = entry.count;
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
        title,
        description,
        author,
        role,
        tags,
        project,
        region,
        type,
        status: "Pending Validation",
        createdAt: new Date(),
      };

      try {
        const result = await knowledgeCollection.insertOne(item);
        const saved = serializeKnowledge({ _id: result.insertedId, ...item });
        sendJson(res, 201, { message: "Knowledge submitted", item: saved });
      } catch (error) {
        sendJson(res, 500, { error: "Failed to submit knowledge" });
      }

      return;
    }

    if (req.method === "PUT" && req.url.startsWith("/api/validate/")) {
      const id = req.url.split("/").pop();
      let objectId = null;
      try {
        objectId = new ObjectId(id);
      } catch {
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
        const result = await knowledgeCollection.findOneAndUpdate(
          { _id: objectId },
          {
            $set: {
              status: decision,
              validatedBy: validator,
              validatedAt: new Date(),
            },
          },
          { returnDocument: "after" }
        );

        if (!result.value) {
          sendJson(res, 404, { error: "Knowledge item not found" });
          return;
        }

        sendJson(res, 200, {
          message: "Validation updated",
          item: serializeKnowledge(result.value),
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
