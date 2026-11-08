// Products: extra categories and gallery photos are cleaned up on save (no duplicates, no main category, https only).
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SERVER = process.env.SERVER || path.join(__dirname, "..", "Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, { MONGO_URL: mongod.getUri(), JWT_SECRET: "s" });
  const mongoose = req("mongoose"), express = req("express"), cookieParser = req("cookie-parser"), jwt = req("jsonwebtoken");
  await mongoose.connect(process.env.MONGO_URL);
  const app = express(); app.use(express.json()); app.use(cookieParser());
  app.use("/products", require(path.join(SERVER, "routes/productRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const admin = jwt.sign({ _id: String(new mongoose.Types.ObjectId()), role: "admin" }, "s");
  const send = (method, p, body) => fetch(base + p, { method, headers: { "Content-Type": "application/json", "x-api-key": admin }, body: JSON.stringify(body) });

  const mainImage = "https://res.cloudinary.com/demo/image/upload/v1/main.jpg";
  let r = await send("POST", "/products", {
    name: "ספל", description: "ספל לבן", price: 40, stock: 5, image: mainImage, category: "ספלים",
    extraCategories: ["ספלים", " מתנות ", "מתנות", "", "לבית"],
    gallery: [mainImage, "https://res.cloudinary.com/demo/image/upload/v1/side.jpg", "http://insecure/x.jpg", "javascript:alert(1)", "https://res.cloudinary.com/demo/image/upload/v1/side.jpg"],
  });
  let product = await r.json();
  assert.strictEqual(r.status, 200, JSON.stringify(product));
  assert.deepStrictEqual(product.extraCategories, ["מתנות", "לבית"], "trimmed, unique, without the main category");
  assert.deepStrictEqual(product.gallery, ["https://res.cloudinary.com/demo/image/upload/v1/side.jpg"], "https only, unique, without the main image");

  // an older product without the new fields still loads with empty lists
  const { ProductModel } = require(path.join(SERVER, "models/productModel"));
  await ProductModel.collection.insertOne({ name: "ישן", description: "x", price: 1, stock: 1, image: mainImage, category: "ספלים" });
  r = await fetch(base + "/products"); const all = await r.json();
  const old = all.find((p) => p.name === "ישן");
  assert.ok(old, "old product listed");
  assert.deepStrictEqual([old.extraCategories, old.gallery], [[], []], "defaults for old products");

  // updating only the gallery keeps the categories
  r = await send("PUT", `/products/${product._id}`, { gallery: [] });
  product = await r.json();
  assert.deepStrictEqual(product.gallery, []);
  assert.deepStrictEqual(product.extraCategories, ["מתנות", "לבית"]);

  console.log("PRODUCT TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
