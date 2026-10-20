// Broadcast: mail service down -> fast 503 after first batch; concurrent broadcast -> 409.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URL = mongod.getUri(); process.env.JWT_SECRET = "s"; process.env.CLIENT_URL = "https://flaash.co.il";
  let calls = 0, gate = null;
  const sendEmailPath = require.resolve(path.join(SERVER, "utils/sendEmail"));
  require.cache[sendEmailPath] = { id: sendEmailPath, filename: sendEmailPath, loaded: true, exports: {
    hasEmailCredentials: () => true,
    sendEmail: async () => { calls += 1; if (gate) await gate; const e = new Error("Connection timeout"); e.code = "ETIMEDOUT"; throw e; },
  } };
  const mongoose = req("mongoose"), express = req("express"), cookieParser = req("cookie-parser"), jwt = req("jsonwebtoken");
  await mongoose.connect(process.env.MONGO_URL);
  const Club = require(path.join(SERVER, "models/clubModel"));
  const ClubModel = Club.ClubModel || Club;
  await ClubModel.insertMany(Array.from({ length: 23 }, (_, i) => ({ name: "n" + i, email: `m${i}@ex.com`, giftCode: "GIFT-" + i })));
  const app = express(); app.use(express.json()); app.use(cookieParser());
  app.use("/club", require(path.join(SERVER, "routes/clubRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const admin = jwt.sign({ _id: "1", role: "admin" }, "s");
  const send = () => fetch(base + "/club/broadcast", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": admin }, body: JSON.stringify({ subject: "s", message: "m", recipientType: "all" }) });

  let r = await send();
  const body = await r.json();
  assert.strictEqual(r.status, 503, JSON.stringify(body));
  assert.strictEqual(calls, 5, "stopped after the first batch");
  assert.strictEqual(body.failed.length, 23);

  let release; gate = new Promise((res) => { release = res; });
  const first = send();
  await new Promise((res) => setTimeout(res, 100));
  r = await send(); assert.strictEqual(r.status, 409);
  release(); assert.strictEqual((await first).status, 503);
  r = await send(); assert.strictEqual(r.status, 503, "lock released after finishing");
  console.log("BROADCAST DOWN TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
