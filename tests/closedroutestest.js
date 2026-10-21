// The AI mockup route answers "not active yet" without calling Gemini, and the open gift-redeem route is gone.
const path = require("path");
const assert = require("assert");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  process.env.JWT_SECRET = "s";
  const ai = require(path.join(SERVER, "utils/aiService"));
  let aiCalls = 0; ai.generatePersonalizedProduct = async () => { aiCalls++; return "x"; };
  const express = req("express");
  const app = express(); app.use(express.json());
  app.use("/products", require(path.join(SERVER, "routes/productRoutes")));
  app.use("/club", require(path.join(SERVER, "routes/clubRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  let r = await fetch(base + "/products/generate-mockup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productName: "ספל", designImage: "data:x" }) });
  assert.strictEqual(r.status, 503);
  assert.ok((await r.json()).msg.includes("בקרוב"));
  assert.strictEqual(aiCalls, 0, "Gemini is never called");
  r = await fetch(base + "/club/redeem", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: "x" }) });
  assert.strictEqual(r.status, 404, "redeem route removed");
  console.log("CLOSED ROUTES TESTS PASSED");
  server.close(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
