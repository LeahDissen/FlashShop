// Club discounts: member price and album discount for members (by account email), the join gift once,
// legacy 15% codes, join with/without the gift, checkout quote = order price, sales moved to members-only.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, { MONGO_URL: mongod.getUri(), JWT_SECRET: "s" });
  delete process.env.HYP_MASOF; delete process.env.EMAIL_USER; delete process.env.EMAIL_PASS; delete process.env.EMAIL_PROVIDER;

  const mongoose = req("mongoose"), express = req("express"), cookieParser = req("cookie-parser"), jwt = req("jsonwebtoken");
  await mongoose.connect(process.env.MONGO_URL);
  const { ProductModel } = require(path.join(SERVER, "models/productModel"));
  const { ClubModel } = require(path.join(SERVER, "models/clubModel"));
  const { UserModel } = require(path.join(SERVER, "models/userModel"));
  const { ShopSettingsModel } = require(path.join(SERVER, "models/shopSettingsModel"));
  const { computeClubDiscounts, albumPercentFor } = require(path.join(SERVER, "services/clubDiscountService"));
  const { migrateSalesToMemberDiscounts } = require(path.join(SERVER, "services/memberSaleMigration"));

  // pure calculation
  const mugP = { _id: "m", name: "ספל", memberDiscount: { type: "percent", value: 10 } };
  let d = computeClubDiscounts({ entries: [{ productId: "m", unitPrice: 50, quantity: 2, product: mugP }] });
  assert.deepStrictEqual(d, { member: 10, album: 0, gift: 0, giftApplied: false });
  d = computeClubDiscounts({ entries: [{ productId: "m", unitPrice: 50, quantity: 2, product: mugP }], gift: { productId: "m", discountType: "percent", value: 100 } });
  assert.deepStrictEqual(d, { member: 5, album: 0, gift: 50, giftApplied: true }, "gift on one unit, member price on the other");
  assert.strictEqual(albumPercentFor([{ minQuantity: 100, percent: 10 }, { minQuantity: 200, percent: 15 }], 250), 15);
  const albumP = { name: "אלבום תמונות", category: "אלבום" };
  d = computeClubDiscounts({ entries: [{ productId: "a", unitPrice: 200, quantity: 1, product: albumP }], albumPercent: 15 });
  assert.strictEqual(d.album, 30);

  const app = express(); app.use(express.json({ limit: "5mb" })); app.use(cookieParser());
  app.use("/orders", require(path.join(SERVER, "routes/ordersRoutes")));
  app.use("/club", require(path.join(SERVER, "routes/clubRoutes")));
  app.use("/shop-settings", require(path.join(SERVER, "routes/shopSettingsRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const mkUser = async (email) => {
    const u = await UserModel.create({ name: "x", email, password: "hashed-not-used" });
    return jwt.sign({ _id: String(u._id), role: "user" }, "s");
  };
  const admin = jwt.sign({ _id: "a", role: "admin" }, "s");
  const memberTok = await mkUser("Member@Example.com"), outsiderTok = await mkUser("out@example.com");
  const customer = { name: "רבקה כהן", phone: "0531112222", email: "r@example.com" };
  const post = (p, body, tok) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": tok }, body: JSON.stringify(body) });
  const order = (items, tok, couponCode) => post("/orders", { items, customer, fulfillmentMethod: "pickup", couponCode }, tok);

  const mug = await ProductModel.create({ name: "ספל", price: 50, category: "ספלים", image: "https://x/m.jpg", description: "ספל", stock: 10, memberDiscount: { type: "percent", value: 20 } });
  const bag = await ProductModel.create({ name: "תיק", price: 40, category: "תיקים", image: "https://x/b.jpg", description: "תיק", stock: 10 });
  const items = [{ productId: String(mug._id), name: "ספל", price: 50, quantity: 2 }, { productId: String(bag._id), name: "תיק", price: 40, quantity: 1 }];

  // join with the gift off: no code, giftType none
  let r = await post("/club/join", { name: "חברה", email: "member@example.com" }, memberTok);
  let body = await r.json();
  assert.strictEqual(r.status, 201, JSON.stringify(body)); assert.strictEqual(body.code, null);
  assert.strictEqual((await ClubModel.findOne({ email: "member@example.com" }).lean()).giftType, "none");

  // member price for the logged-in member (email matched case-insensitively); the outsider pays full and sees the saving
  r = await post("/orders/quote", { items }, memberTok); body = await r.json();
  assert.strictEqual(body.isMember, true); assert.strictEqual(body.discount, 20); assert.strictEqual(body.discounts[0].kind, "member");
  r = await post("/orders/quote", { items }, outsiderTok); body = await r.json();
  assert.strictEqual(body.isMember, false); assert.strictEqual(body.discount, 0); assert.strictEqual(body.potentialMemberSavings, 20);
  r = await order(items, memberTok); body = await r.json();
  assert.strictEqual(r.status, 201, JSON.stringify(body)); assert.strictEqual(body.total_price, 120, "140 - 20% of the mugs");

  // the join gift: admin turns it on (bag free), a new member joins, gets a code, the gift applies once
  r = await fetch(base + "/shop-settings", { method: "PUT", headers: { "Content-Type": "application/json", "x-api-key": admin }, body: JSON.stringify({ clubGift: { enabled: true, productId: String(bag._id), discountType: "percent", value: 100 }, notMemberText: "הצטרפי!" }) });
  assert.strictEqual(r.status, 200);
  r = await fetch(base + "/shop-settings", { method: "PUT", headers: { "Content-Type": "application/json", "x-api-key": admin }, body: JSON.stringify({ clubGift: { enabled: true, productId: "", value: 10 } }) });
  assert.strictEqual(r.status, 400, "gift on without a product");
  const giftTok = await mkUser("new@example.com");
  // the gift waits for the email confirmation: until then no gift at checkout
  const confirmJoin = async (email) => {
    const m = await ClubModel.findOne({ email }).lean();
    // pressing the button on the confirmation page (opening the link alone confirms nothing)
    const res = await fetch(`${base}/club/confirm/${m.verifyToken}`, { method: "POST" }); assert.strictEqual(res.status, 200);
    return m.giftCode;
  };
  r = await post("/club/join", { name: "חדשה", email: "new@example.com" }, giftTok); body = await r.json();
  assert.strictEqual(body.code, null); assert.strictEqual(body.pendingGift, true);
  r = await post("/orders/quote", { items }, giftTok); body = await r.json();
  assert.strictEqual(body.discount, 20, "member price only before confirming");
  const pendingCode = (await ClubModel.findOne({ email: "new@example.com" }).lean()).giftCode;
  r = await post("/orders/quote", { items, couponCode: pendingCode }, outsiderTok); assert.strictEqual(r.status, 400, "pending code refused");
  const giftCode = await confirmJoin("new@example.com");
  assert.ok(/^GIFT-/.test(giftCode));
  r = await post("/orders/quote", { items }, giftTok); body = await r.json();
  assert.deepStrictEqual(body.discounts.map((x) => x.kind).sort(), ["gift", "member"]); assert.strictEqual(body.discount, 60, "20 member + 40 gift bag");
  r = await order(items, giftTok); body = await r.json();
  assert.strictEqual(body.total_price, 80);
  assert.strictEqual((await ClubModel.findOne({ email: "new@example.com" }).lean()).isUsed, true, "gift used after the order");
  r = await post("/orders/quote", { items }, giftTok); body = await r.json();
  assert.strictEqual(body.discount, 20, "gift only once; member price stays");
  r = await fetch(`${base}/club/check/${giftCode}`); body = await r.json();
  assert.strictEqual(body.valid, false);
  r = await post("/orders/quote", { items, couponCode: "NOPE" }, outsiderTok);
  assert.strictEqual(r.status, 400);

  // a gift code typed without the gift product in the cart is not burned by the order
  const lateTok = await mkUser("late@example.com");
  r = await post("/club/join", { name: "מאוחרת", email: "late@example.com" }, lateTok); body = await r.json();
  const lateCode = await confirmJoin("late@example.com");
  const mugOnly = [{ productId: String(mug._id), name: "ספל", price: 50, quantity: 1 }];
  r = await order(mugOnly, outsiderTok, lateCode); body = await r.json();
  assert.strictEqual(r.status, 201, JSON.stringify(body));
  assert.strictEqual((await ClubModel.findOne({ email: "late@example.com" }).lean()).isUsed, false, "gift still available");

  // a design per copy: the quantity must match the number of designs
  const copiesItem = (qty, n) => [{ productId: String(mug._id), name: "ספל", price: 50, quantity: qty, customDesign: { copies: Array.from({ length: n }, (_, i) => ({ image: `https://x/c${i}.png` })) } }];
  r = await post("/orders/quote", { items: copiesItem(3, 3) }, outsiderTok); assert.strictEqual(r.status, 200);
  r = await post("/orders/quote", { items: copiesItem(5, 3) }, outsiderTok); assert.strictEqual(r.status, 400);

  // a legacy code (member from before the gift) still gives 15% off what is left
  await ClubModel.create({ name: "ותיקה", email: "old@example.com", giftCode: "GIFT-OLD111", isUsed: false });
  r = await post("/orders/quote", { items, couponCode: "GIFT-OLD111" }, outsiderTok); body = await r.json();
  assert.strictEqual(body.discount, 21, "15% of 140");

  // sales move to members-only: previous price becomes the price, sale price the members' price
  const sale = await ProductModel.create({ name: "פאזל", price: 30, originalPrice: 45, isOnSale: true, category: "x", image: "https://x/p.jpg", description: "p", stock: 1 });
  const noPrev = await ProductModel.create({ name: "שעון", price: 80, isOnSale: true, category: "x", image: "https://x/c.jpg", description: "c", stock: 1 });
  await migrateSalesToMemberDiscounts(); await migrateSalesToMemberDiscounts();
  const s1 = await ProductModel.findById(sale._id).lean(), s2 = await ProductModel.findById(noPrev._id).lean();
  assert.strictEqual(s1.price, 45); assert.deepStrictEqual({ ...s1.memberDiscount }, { type: "price", value: 30 }); assert.strictEqual(s1.isOnSale, true);
  assert.strictEqual(s2.isOnSale, false);

  // the shop closed to the public: visitors cannot order, the admin still can, and it opens again
  const putSettings = (body) => fetch(base + "/shop-settings", { method: "PUT", headers: { "Content-Type": "application/json", "x-api-key": admin }, body: JSON.stringify(body) });
  r = await putSettings({ siteClosed: true, closedMessage: "בקרוב!" }); assert.strictEqual(r.status, 200);
  body = await (await fetch(base + "/shop-settings")).json();
  assert.strictEqual(body.siteClosed, true); assert.strictEqual(body.closedMessage, "בקרוב!");
  r = await order(items, memberTok); assert.strictEqual(r.status, 403); assert.strictEqual((await r.json()).code, "SITE_CLOSED");
  r = await putSettings({ notMemberText: "x" }); assert.strictEqual((await r.json()).siteClosed, true, "other settings keep it closed");
  r = await putSettings({ siteClosed: false }); assert.strictEqual((await r.json()).siteClosed, false);
  r = await order(items, memberTok); assert.strictEqual(r.status, 201, "orders again once open");

  console.log("CLUB DISCOUNT TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
