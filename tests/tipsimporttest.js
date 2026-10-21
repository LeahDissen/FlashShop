// Tips import: admin only, every tip needs title/text/https image, saved in the document's order (first tip newest).
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, { MONGO_URL: mongod.getUri(), JWT_SECRET: "s" });
  const mongoose = req("mongoose"), express = req("express"), cookieParser = req("cookie-parser"), jwt = req("jsonwebtoken");
  await mongoose.connect(process.env.MONGO_URL);
  const app = express(); app.use(express.json()); app.use(cookieParser());
  app.use("/tips", require(path.join(SERVER, "routes/tipsRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const admin = jwt.sign({ _id: "a", role: "admin" }, "s"), user = jwt.sign({ _id: "u", role: "user" }, "s");
  const post = (body, tok) => fetch(base + "/tips/import", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": tok }, body: JSON.stringify(body) });
  const tip = (n, images = [`https://res.cloudinary.com/c/image/upload/v1/t${n}.jpg`]) => ({ title: `טיפ ${n}`, content: `תוכן ${n}`, images });

  assert.strictEqual((await post({ tips: [tip(1)] }, user)).status, 403);
  assert.strictEqual((await post({ tips: [tip(1, ["javascript:alert(1)"])] }, admin)).status, 400, "non-https image rejected");
  assert.strictEqual((await post({ tips: [] }, admin)).status, 400);
  let r = await post({ tips: [tip(1, ["https://x/a.jpg", "https://x/b.jpg"]), tip(2), tip(3)] }, admin);
  assert.strictEqual(r.status, 201);
  r = await fetch(base + "/tips?page=1&limit=10"); const { tips } = await r.json();
  assert.deepStrictEqual(tips.map((t) => t.title), ["טיפ 1", "טיפ 2", "טיפ 3"], "document order");
  assert.strictEqual(tips[0].img, "https://x/a.jpg"); assert.deepStrictEqual(tips[0].images, ["https://x/b.jpg"]);
  assert.ok(tips[0].summary.startsWith("תוכן 1"));

  console.log("TIPS IMPORT TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
