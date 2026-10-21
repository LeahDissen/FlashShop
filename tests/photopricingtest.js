// Photo pricing: per-size price tiers (₪), legacy conversion of Michal's saved data, admin PUT validation.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URL = mongod.getUri(); process.env.JWT_SECRET = "s";
  const mongoose = req("mongoose"), express = req("express"), cookieParser = req("cookie-parser"), jwt = req("jsonwebtoken");
  await mongoose.connect(process.env.MONGO_URL);
  const app = express(); app.use(express.json()); app.use(cookieParser());
  app.use("/photo-prices", require(path.join(SERVER, "routes/photoPricingRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}/photo-prices`;
  const admin = jwt.sign({ _id: "1", role: "admin" }, "s");
  const put = (body, token = admin) => fetch(base, { method: "PUT", headers: { "Content-Type": "application/json", "x-api-key": token }, body: JSON.stringify(body) });
  const { getPhotoUnitPrice, countPrintsBySize } = require(path.join(SERVER, "utils/photoQuantityPricing"));
  const { PhotoPricingModel } = require(path.join(SERVER, "models/photoPricingModel"));

  // defaults reproduce the original price list
  let pricing = await (await fetch(base)).json();
  assert.deepStrictEqual([1, 40, 100, 200, 500].map((n) => getPhotoUnitPrice(pricing, "10x15", n)), [1.8, 1.25, 1.1, 0.9, 0.8]);

  // Michal's saved legacy doc: shekel prices typed into the "percent" fields -> become 10x15 price tiers
  await PhotoPricingModel.collection.insertOne({
    key: "default",
    sizes: [{ size: "10x15", price: 2, label: "x" }, { size: "13x18", price: 4 }, { size: "15x20", price: 6 }, { size: "21x29.7", price: 15 }],
    quantityTiers: [{ minQuantity: 10, discountPercent: 1.3 }, { minQuantity: 50, discountPercent: 1.2 }, { minQuantity: 800, discountPercent: 0.8 }],
    albumDiscountTiers: [{ minQuantity: 100, percent: 10 }],
  });
  pricing = await (await fetch(base)).json();
  assert.deepStrictEqual(pricing.sizes[0].tiers, [{ minQuantity: 1, price: 2 }, { minQuantity: 10, price: 1.3 }, { minQuantity: 50, price: 1.2 }, { minQuantity: 800, price: 0.8 }]);
  assert.deepStrictEqual(pricing.sizes[3].tiers, [{ minQuantity: 1, price: 15 }]);
  assert.strictEqual(getPhotoUnitPrice(pricing, "10x15", 60), 1.2);
  assert.strictEqual(getPhotoUnitPrice(pricing, "21×29.7", 60), 15);

  // a true percent legacy doc converts to prices for every size
  await PhotoPricingModel.collection.updateOne({ key: "default" }, { $set: { quantityTiers: [{ minQuantity: 40, discountPercent: 50 }] } });
  pricing = await (await fetch(base)).json();
  assert.strictEqual(getPhotoUnitPrice(pricing, "13x18", 40), 2);

  // validation
  assert.strictEqual((await put(pricing, null)).status, 401);
  assert.strictEqual((await put({ sizes: [{ size: "10x15", tiers: [{ minQuantity: 5, price: 1 }] }], albumDiscountTiers: [] })).status, 400, "first tier must start at 1");
  assert.strictEqual((await put({ sizes: [{ size: "10x15", tiers: [{ minQuantity: 1, price: -1 }] }], albumDiscountTiers: [] })).status, 400);
  assert.strictEqual((await put({ sizes: [{ size: "10x15", tiers: [{ minQuantity: 1, price: 1 }, { minQuantity: 1, price: 2 }] }], albumDiscountTiers: [] })).status, 400);

  // save new shape: legacy field is removed, tiers sorted, per-size counting
  const r = await put({
    sizes: [{ size: "10x15", tiers: [{ minQuantity: "100", price: "1.1" }, { minQuantity: 1, price: 2 }] }, { size: "21x29.7", tiers: [{ minQuantity: 1, price: 15 }, { minQuantity: 10, price: 12 }] }],
    albumDiscountTiers: [{ minQuantity: 100, percent: 10 }],
  });
  assert.strictEqual(r.status, 200);
  const raw = await PhotoPricingModel.collection.findOne({ key: "default" });
  assert.ok(!("quantityTiers" in raw), "legacy field removed");
  pricing = await (await fetch(base)).json();
  assert.deepStrictEqual(pricing.sizes[0].tiers.map((t) => t.minQuantity), [1, 100]);
  const counts = countPrintsBySize([{ size: "10x15", quantity: 60 }, { size: "10×15", quantity: 50 }, { size: "21x29.7", quantity: 9 }], (i) => i.size, (i) => i.quantity);
  assert.deepStrictEqual(counts, { "10x15": 110, "21x29.7": 9 });
  assert.strictEqual(getPhotoUnitPrice(pricing, "10x15", counts["10x15"]), 1.1);
  assert.strictEqual(getPhotoUnitPrice(pricing, "21x29.7", counts["21x29.7"]), 15);
  console.log("PHOTO PRICING TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
