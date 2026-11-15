// Colors, sizes and stock: the choice is checked against the product, the cart cannot exceed the stock,
// and a paid order lowers the stock exactly once.
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
  const { OrderModel } = require(path.join(SERVER, "models/ordersModel"));
  const { completeOrder } = require(path.join(SERVER, "services/orderCompletionService"));
  const app = express(); app.use(express.json({ limit: "5mb" })); app.use(cookieParser());
  app.use("/orders", require(path.join(SERVER, "routes/ordersRoutes")));
  app.use("/products", require(path.join(SERVER, "routes/productRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const userId = String(new mongoose.Types.ObjectId());
  const user = jwt.sign({ _id: userId, role: "user" }, "s");
  const admin = jwt.sign({ _id: String(new mongoose.Types.ObjectId()), role: "admin" }, "s");
  const customer = { name: "רבקה כהן", phone: "0531112222", email: "r@example.com" };
  const order = (items) => fetch(base + "/orders", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": user },
    body: JSON.stringify({ items, customer, fulfillmentMethod: "pickup", termsAccepted: true }),
  });

  // The admin saves a shirt with colors, sizes and stock: junk is cleaned, the stock grid has every combination
  const created = await fetch(base + "/products", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-key": admin },
    body: JSON.stringify({
      name: "חולצת מבוגר", description: "d", price: 40, stock: 0, image: "https://x/s.jpg", category: "חולצות",
      trackStock: true,
      colors: [{ name: "לבן", hex: "#ffffff" }, { name: "שחור", hex: "bad", image: "http://not-https" }, { name: "לבן" }, { name: " " }],
      sizes: ["M", "L", "M", ""],
      variantStock: [{ color: "לבן", size: "M", stock: 3 }, { color: "שחור", size: "L", stock: -5 }, { color: "ירוק", size: "M", stock: 9 }],
    }),
  });
  const shirt = await created.json();
  assert.ok(created.ok, JSON.stringify(shirt));
  assert.deepStrictEqual(shirt.colors.map((c) => [c.name, c.hex, c.image]), [["לבן", "#FFFFFF", ""], ["שחור", "#FFFFFF", ""]]);
  assert.deepStrictEqual(shirt.sizes, ["M", "L"]);
  assert.strictEqual(shirt.variantStock.length, 4, "one row per color × size");
  const stockOf = (p, color, size) => p.variantStock.find((v) => v.color === color && v.size === size).stock;
  assert.strictEqual(stockOf(shirt, "לבן", "M"), 3);
  assert.strictEqual(stockOf(shirt, "שחור", "L"), 0, "negative stock becomes 0");
  const id = String(shirt._id);

  // A color/size must be chosen, and from the product's own options
  let r = await order([{ productId: id, quantity: 1 }]);
  assert.strictEqual(r.status, 400, "missing color rejected");
  r = await order([{ productId: id, quantity: 1, variant: { color: "ירוק", size: "M" } }]);
  assert.strictEqual(r.status, 400, "unknown color rejected");
  r = await order([{ productId: id, quantity: 1, variant: { color: "לבן", size: "XXL" } }]);
  assert.strictEqual(r.status, 400, "unknown size rejected");

  // Sold out and over the stock (also when split over two cart lines)
  r = await order([{ productId: id, quantity: 1, variant: { color: "שחור", size: "L" } }]);
  assert.match((await r.json()).msg, /אזל מהמלאי/);
  r = await order([
    { productId: id, quantity: 2, variant: { color: "לבן", size: "M" } },
    { productId: id, quantity: 2, variant: { color: "לבן", size: "M" }, customDesign: { projectId: "p" } },
  ]);
  assert.match((await r.json()).msg, /נשארו במלאי רק 3/);

  // A valid order: the name shows the choice, the variant is saved, the stock goes down once
  r = await order([{ productId: id, name: "x", price: 1, quantity: 2, variant: { color: "לבן", size: "M" } }]);
  let body = await r.json();
  assert.strictEqual(r.status, 201, JSON.stringify(body));
  assert.strictEqual(body.total_price, 80, "price does not change by color/size");
  assert.strictEqual(body.items[0].name, "חולצת מבוגר (לבן · M)");
  assert.deepStrictEqual(body.items[0].variant, { color: "לבן", size: "M" });
  let fresh = await ProductModel.findById(id).lean();
  assert.strictEqual(stockOf(fresh, "לבן", "M"), 1, "paid order lowered the stock");
  assert.strictEqual(stockOf(fresh, "לבן", "L"), 0, "other combinations untouched");
  // A second completion (e.g. a refreshed payment page) does not lower it again
  await completeOrder(await OrderModel.findById(body._id), userId);
  fresh = await ProductModel.findById(id).lean();
  assert.strictEqual(stockOf(fresh, "לבן", "M"), 1, "stock lowered only once per order");

  // A plain product with tracking uses its single stock; without tracking nothing changes
  const mug = await ProductModel.create({ name: "ספל", price: 50, category: "ספלים", image: "https://x/m.jpg", description: "d", stock: 2, trackStock: true });
  const bag = await ProductModel.create({ name: "תיק", price: 30, category: "תיקים", image: "https://x/b.jpg", description: "d", stock: 1 });
  r = await order([{ productId: String(mug._id), quantity: 3 }]);
  assert.strictEqual(r.status, 400, "over the plain stock");
  r = await order([{ productId: String(mug._id), quantity: 2 }, { productId: String(bag._id), quantity: 5 }]);
  assert.strictEqual(r.status, 201, "untracked product is not limited by its stock number");
  assert.strictEqual((await ProductModel.findById(mug._id)).stock, 0);
  assert.strictEqual((await ProductModel.findById(bag._id)).stock, 1, "untracked stock untouched");
  // A product without colors ignores a variant the browser made up
  r = await order([{ productId: String(bag._id), quantity: 1, variant: { color: "אדום" } }]);
  body = await r.json();
  assert.strictEqual(body.items[0].name, "תיק");
  assert.ok(!body.items[0].variant?.color, "no variant on a product without options");

  console.log("STOCK TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
