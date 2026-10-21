// Order prices come from the server only: tampered cart prices, negative quantities and unknown products are rejected.
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
  const { ProductModel } = require(path.join(SERVER, "models/productModel"));
  const app = express(); app.use(express.json({ limit: "5mb" })); app.use(cookieParser());
  app.use("/orders", require(path.join(SERVER, "routes/ordersRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const user = jwt.sign({ _id: String(new mongoose.Types.ObjectId()), role: "user" }, "s");
  const customer = { name: "רבקה כהן", phone: "0531112222", email: "r@example.com" };
  const order = (items) => fetch(base + "/orders", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": user },
    body: JSON.stringify({ items, customer, fulfillmentMethod: "pickup" }),
  });

  const mug = await ProductModel.create({ name: "ספל", price: 50, category: "ספלים", image: "https://x/m.jpg", description: "ספל לבן", stock: 10 });
  const id = String(mug._id);

  // a design from the editor with a tampered price is charged the product price
  let r = await order([{ productId: id, name: "ספל בעיצוב אישי", price: 0.01, quantity: 2, customDesign: { projectId: "p" } }]);
  let body = await r.json();
  assert.strictEqual(r.status, 201, JSON.stringify(body));
  assert.strictEqual(body.total_price, 100, "design priced from the product");
  assert.strictEqual(body.items[0].name, "ספל בעיצוב אישי", "design keeps its own name");

  // the designer service adds the fixed fee on top of the product price
  r = await order([{ productId: id, name: "ספל", price: 1, quantity: 1, customization: { type: "designer-service" } }]);
  body = await r.json();
  assert.strictEqual(body.total_price, 65, "designer service = product + 15");

  // negative, zero and fractional quantities are rejected
  for (const quantity of [-5, 0, 1.5, "abc"]) {
    r = await order([{ productId: id, name: "ספל", price: 50, quantity: 1 }, { productId: id, name: "ספל", price: 50, quantity }]);
    assert.strictEqual(r.status, 400, `quantity ${quantity}`);
  }

  // an item that is not a catalog product cannot set its own price
  r = await order([{ name: "מסגרת", price: 0.1, quantity: 1 }]);
  assert.strictEqual(r.status, 400, "item without product");
  r = await order([{ productId: String(new mongoose.Types.ObjectId()), name: "אלבום", price: 0.5, quantity: 1 }]);
  assert.strictEqual(r.status, 400, "unknown product id");
  r = await order([{ name: "עיצוב", price: 0.1, quantity: 1, customDesign: { projectId: "p" } }]);
  assert.strictEqual(r.status, 400, "design without product");

  // a regular product still works, and a line id like "<productId>-rec-123" resolves to the product
  r = await order([{ id: `${id}-rec-123`, name: "ספל", price: 50, quantity: 1 }]);
  body = await r.json();
  assert.strictEqual(r.status, 201); assert.strictEqual(body.total_price, 50);

  console.log("PRICE TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
