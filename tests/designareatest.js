// Extra design areas: the admin's list is cleaned, and an order line keeps each area's print file (https only).
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, { MONGO_URL: mongod.getUri(), JWT_SECRET: "s" });
  delete process.env.HYP_MASOF; delete process.env.EMAIL_USER; delete process.env.EMAIL_PASS;

  const mongoose = req("mongoose"), express = req("express"), cookieParser = req("cookie-parser"), jwt = req("jsonwebtoken");
  await mongoose.connect(process.env.MONGO_URL);
  const app = express(); app.use(express.json({ limit: "5mb" })); app.use(cookieParser());
  app.use("/orders", require(path.join(SERVER, "routes/ordersRoutes")));
  app.use("/products", require(path.join(SERVER, "routes/productRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const user = jwt.sign({ _id: String(new mongoose.Types.ObjectId()), role: "user" }, "s");
  const admin = jwt.sign({ _id: String(new mongoose.Types.ObjectId()), role: "admin" }, "s");
  const post = (url, token, body) => fetch(base + url, {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": token }, body: JSON.stringify(body),
  });

  let r = await post("/products", admin, {
    name: "חולצה דו-צדדית", description: "d", price: 50, stock: 1, image: "https://x/s.jpg", category: "חולצות",
    designAreas: [
      { name: "גב", printWidth: 25, printHeight: 30 },
      { name: "גב", printWidth: 10, printHeight: 10 },
      { name: "", printWidth: 5, printHeight: 5 },
      { name: "שרוול", printWidth: 0, printHeight: 8 },
      { name: "כיס", printWidth: 8, printHeight: 8 },
      { name: "a", printWidth: 1, printHeight: 1 }, { name: "b", printWidth: 1, printHeight: 1 }, { name: "c", printWidth: 1, printHeight: 1 },
    ],
  });
  const shirt = await r.json();
  assert.ok(r.ok, JSON.stringify(shirt));
  assert.deepStrictEqual(shirt.designAreas.map((a) => a.name), ["גב", "כיס", "a", "b"], "unique, named, sized, max 4");

  r = await post("/orders", user, {
    customer: { name: "רבקה כהן", phone: "0531112222", email: "r@example.com" }, fulfillmentMethod: "pickup", termsAccepted: true,
    items: [{
      productId: shirt._id, name: "חולצה דו-צדדית בעיצוב אישי + גב", price: 1, quantity: 1,
      customDesign: { projectId: "p", areas: [
        { name: "גב", image: "https://res.cloudinary.com/x/back.png", widthCm: 25, heightCm: 30 },
        { name: "כיס", image: "javascript:alert(1)" },
      ] },
    }],
  });
  const order = await r.json();
  assert.strictEqual(r.status, 201, JSON.stringify(order));
  assert.strictEqual(order.total_price, 50, "areas do not change the price");
  assert.deepStrictEqual(order.items[0].customDesign.areas, [{ name: "גב", image: "https://res.cloudinary.com/x/back.png", widthCm: 25, heightCm: 30 }]);
  assert.strictEqual(order.items[0].name, "חולצה דו-צדדית בעיצוב אישי + גב");

  console.log("DESIGN AREA TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
