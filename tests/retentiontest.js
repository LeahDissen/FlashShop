// Photo retention: photos of printed/cancelled orders go 30 days after the status change, unpaid ones after 7;
// shared photos and charges under review are kept; status changes record the date; never runs twice.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, { MONGO_URL: mongod.getUri(), JWT_SECRET: "s", CLOUDINARY_URL: "cloudinary://key:secret@mycloud" });
  const axios = require(require.resolve("axios", { paths: [path.join(SERVER, "services")] }));
  const deletes = []; axios.delete = async (url, opts) => { deletes.push({ url, auth: opts.auth }); return { data: {} }; };

  const mongoose = req("mongoose"), express = req("express"), cookieParser = req("cookie-parser"), jwt = req("jsonwebtoken");
  await mongoose.connect(process.env.MONGO_URL);
  const { OrderModel } = require(path.join(SERVER, "models/ordersModel"));
  const svc = require(path.join(SERVER, "services/photoRetentionService"));

  assert.strictEqual(svc.publicIdFromUrl("https://res.cloudinary.com/mycloud/image/upload/v1792062691/IMG_0009_ubzypp.jpg", "mycloud"), "IMG_0009_ubzypp");
  assert.strictEqual(svc.publicIdFromUrl("https://res.cloudinary.com/mycloud/image/upload/v1/orders/a b.jpg", "mycloud"), "orders/a b");
  assert.strictEqual(svc.publicIdFromUrl("https://res.cloudinary.com/othercloud/image/upload/v1/x.jpg", "mycloud"), null, "other cloud never touched");
  assert.strictEqual(svc.publicIdFromUrl("data:image/png;base64,xx", "mycloud"), null);

  const now = new Date("2026-12-01T00:00:00Z"), days = (n) => new Date(now.getTime() - n * 864e5);
  const url = (id) => `https://res.cloudinary.com/mycloud/image/upload/v1/${id}.jpg`;
  const photo = (id) => ({ name: `פיתוח תמונה 10x15 (${id}.JPG)`, itemType: "photo-print", image: url(id), quantity: 1, price: 1 });
  const uid = new mongoose.Types.ObjectId();
  const mk = (o) => OrderModel.create({ user_id: uid, total_price: 1, ...o });
  const printedOld = await mk({ status: "delivered", statusChangedAt: days(31), items: [photo("a"), photo("shared"), { name: "ספל", image: url("design"), quantity: 1, price: 30 }] });
  const printedNew = await mk({ status: "shipped", statusChangedAt: days(10), items: [photo("b")] });
  const legacyOld = await mk({ status: "delivered", date_created: days(60), items: [photo("c")] });
  const processing = await mk({ status: "processing", statusChangedAt: days(90), items: [photo("d")] });
  const cancelledOld = await mk({ status: "cancelled", statusChangedAt: days(40), items: [photo("e")] });
  const unpaidOld = await mk({ status: "awaiting_payment", date_created: days(8), payment: { provider: "hyp", status: "pending" }, items: [photo("f")] });
  const reviewOld = await mk({ status: "awaiting_payment", date_created: days(30), payment: { provider: "hyp", status: "review" }, items: [photo("g")] });
  const cartWithShared = await mk({ status: "pending", items: [photo("shared")] });

  const result = await svc.purgeDuePhotos(now);
  // printedOld keeps its shared photo (an open cart uses it) -> not marked, rechecked tomorrow
  assert.deepStrictEqual({ orders: result.orders, deleted: result.deleted, kept: result.kept }, { orders: 2, deleted: 3, kept: 1 });
  const deletedIds = deletes.flatMap((d) => [...new URL(d.url).searchParams.getAll("public_ids[]")]).sort();
  assert.deepStrictEqual(deletedIds, ["a", "e", "f"], "only photo-print images of due orders; shared and design images kept; legacy order not counted from creation");
  assert.ok(deletes[0].url.startsWith("https://api.cloudinary.com/v1_1/mycloud/resources/image/upload?"));
  assert.deepStrictEqual(deletes[0].auth, { username: "key", password: "secret" });
  const flag = async (o) => Boolean((await OrderModel.findById(o._id).lean()).photosPurgedAt);
  assert.deepStrictEqual(await Promise.all([printedOld, printedNew, legacyOld, processing, cancelledOld, unpaidOld, reviewOld, cartWithShared].map(flag)),
    [false, false, false, false, true, true, false, false]);
  const legacy = await OrderModel.findById(legacyOld._id).lean();
  assert.strictEqual(legacy.statusChangedAt.getTime(), now.getTime(), "legacy finished order starts its 30 days now");

  // second run: nothing new is marked or deleted (printedOld is rechecked but its shared photo is still in use)
  deletes.length = 0;
  assert.strictEqual((await svc.purgeDuePhotos(now)).orders, 0);
  assert.deepStrictEqual(deletes.flatMap((d) => [...new URL(d.url).searchParams.getAll("public_ids[]")]), ["a"], "only the already-deleted photo is retried (harmless)");

  // status change records the date (the countdown); same status does not reset it
  const app = express(); app.use(express.json()); app.use(cookieParser());
  app.use("/orders", require(path.join(SERVER, "routes/ordersRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const admin = jwt.sign({ _id: "a", role: "admin" }, "s");
  const put = (id, status) => fetch(`${base}/orders/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json", "x-api-key": admin }, body: JSON.stringify({ status }) });
  assert.strictEqual((await put(processing._id, "delivered")).status, 200);
  const changed = (await OrderModel.findById(processing._id).lean()).statusChangedAt;
  assert.ok(changed && Date.now() - changed.getTime() < 60_000, "statusChangedAt set on change");
  await put(processing._id, "delivered");
  assert.strictEqual((await OrderModel.findById(processing._id).lean()).statusChangedAt.getTime(), changed.getTime(), "same status keeps the date");

  // not configured: nothing happens
  const { config } = require(path.join(SERVER, "config/secret")); config.CLOUDINARY_URL = "";
  assert.strictEqual((await svc.purgeDuePhotos(new Date("2030-01-01"))).skipped, "not-configured");

  console.log("RETENTION TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
