// Hyp payment: SIGN builds the payment URL, confirm verifies amount/order/CCode + Hyp VERIFY, is idempotent; admin check.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));
(async () => {
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, { MONGO_URL: mongod.getUri(), JWT_SECRET: "s", HYP_MASOF: "0010000000", HYP_KEY: "k", HYP_PASSP: "p" });
  delete process.env.EMAIL_USER; delete process.env.EMAIL_PASS;

  // fake Hyp: SIGN -> echo + signature; VERIFY -> CCode depends on flag
  const axios = require(require.resolve("axios", { paths: [path.join(SERVER, "services")] })); const calls = []; let verifyCode = "0";
  let payPage = "<html>תשלום</html>";
  axios.get = async (url) => {
    calls.push(url);
    if (url.includes("action=pay&")) return { data: Buffer.from(payPage) };
    const q = new URLSearchParams(url.split("?")[1]);
    if (q.get("What") === "SIGN") return { data: `${url.split("?")[1].replace("action=APISign", "action=pay")}&signature=abc` };
    if (q.get("What") === "VERIFY") return { data: `CCode=${verifyCode}\n` }; // the real Hyp answer ends with a newline
    throw new Error("unexpected " + url);
  };

  const mongoose = req("mongoose"), express = req("express"), cookieParser = req("cookie-parser"), jwt = req("jsonwebtoken");
  await mongoose.connect(process.env.MONGO_URL);
  const { OrderModel } = require(path.join(SERVER, "models/ordersModel"));
  const svc = require(path.join(SERVER, "services/hypPaymentService"));
  const app = express(); app.use(express.json()); app.use(cookieParser());
  app.use("/orders", require(path.join(SERVER, "routes/ordersRoutes")));
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
  const userId = new mongoose.Types.ObjectId();
  const user = jwt.sign({ _id: String(userId), role: "user" }, "s"), admin = jwt.sign({ _id: "a", role: "admin" }, "s");
  const post = (p, body, token = user) => fetch(base + p, { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": token }, body: JSON.stringify(body) });

  // service: payment URL
  const order = await OrderModel.create({ user_id: userId, items: [], total_price: 84.5, status: "awaiting_payment", payment: { provider: "hyp", status: "pending" }, customer: { name: "רבקה כהן לוי", email: "r@x.co", phone: "053-111-2222" } });
  const url = await svc.createPaymentUrl(order);
  assert.ok(url.startsWith("https://pay.hyp.co.il/p/?action=pay"));
  const signQ = new URLSearchParams(calls.at(-1).split("?")[1]);
  assert.strictEqual(signQ.get("Amount"), "84.50"); assert.strictEqual(signQ.get("Order"), String(order._id));
  assert.strictEqual(signQ.get("ClientName"), "רבקה"); assert.strictEqual(signQ.get("ClientLName"), "כהן לוי"); assert.strictEqual(signQ.get("cell"), "0531112222"); assert.strictEqual(signQ.get("UTF8"), "True", "Hebrew sent as UTF-8");

  // confirm: wrong amount / wrong CCode / failed verify are rejected
  const ok = `?Id=555&CCode=0&Amount=84.50&ACode=0012&Order=${order._id}&Fild1=x&Fild2=&Fild3=&Sign=zz`;
  let r = await post(`/orders/${order._id}/payment/confirm`, { query: ok.replace("84.50", "1.00") }); assert.strictEqual(r.status, 400);
  r = await post(`/orders/${order._id}/payment/confirm`, { query: ok.replace("CCode=0", "CCode=6") }); assert.strictEqual(r.status, 400);
  verifyCode = "200"; r = await post(`/orders/${order._id}/payment/confirm`, { query: ok }); assert.strictEqual(r.status, 202, "approved by Hyp but unverified -> review, not failure");
  assert.strictEqual((await r.json()).review, true);
  let flagged = await OrderModel.findById(order._id).lean();
  assert.strictEqual(flagged.payment.status, "review"); assert.strictEqual(flagged.status, "awaiting_payment", "not processed without verification");
  assert.strictEqual(flagged.payment.transactionId, "555"); assert.ok(flagged.payment.returnQuery.includes("Sign=zz"));
  // tampering: a duplicate Order/Amount (we read the first, Hyp may verify the last) or injected terminal credentials
  const verifiesBefore = calls.filter((c) => c.includes("What=VERIFY")).length;
  r = await post(`/orders/${order._id}/payment/confirm`, { query: `${ok}&Order=${new mongoose.Types.ObjectId()}&Amount=1.00` }); assert.strictEqual(r.status, 400, "duplicate params");
  r = await post(`/orders/${order._id}/payment/confirm`, { query: `${ok}&masof=999&KEY=k&PassP=p` }); assert.strictEqual(r.status, 400, "reserved params");
  assert.strictEqual(calls.filter((c) => c.includes("What=VERIFY")).length, verifiesBefore, "tampered redirect never reaches Hyp");
  r = await post(`/orders/${order._id}/payment/confirm`, { query: ok }, jwt.sign({ _id: String(new mongoose.Types.ObjectId()), role: "user" }, "s")); assert.strictEqual(r.status, 403, "other user");

  // success, then idempotent
  verifyCode = "0";
  r = await post(`/orders/${order._id}/payment/confirm`, { query: ok }); assert.strictEqual(r.status, 200);
  let saved = await OrderModel.findById(order._id).lean();
  assert.strictEqual(saved.status, "processing"); assert.strictEqual(saved.payment.status, "paid");
  assert.strictEqual(saved.payment.transactionId, "555"); assert.strictEqual(saved.payment.approvalCode, "0012");
  const verifyCall = calls.filter((c) => c.includes("What=VERIFY")).at(-1);
  assert.ok(verifyCall.endsWith(ok.slice(1)), "redirect params passed in original order");
  const before = calls.length;
  r = await post(`/orders/${order._id}/payment/confirm`, { query: ok }); assert.strictEqual(r.status, 200);
  assert.strictEqual(calls.length, before, "already paid: no second verify");

  // admin connection check
  r = await fetch(base + "/orders/payment/check", { headers: { "x-api-key": admin } });
  assert.deepStrictEqual((await r.json()).ok, true);
  // a wrong KEY still gets signed, but the payment page rejects it: the check must report that
  payPage = "<div>שגיאה - שגיאת אימות</div>";
  r = await fetch(base + "/orders/payment/check", { headers: { "x-api-key": admin } });
  const bad = await r.json(); assert.strictEqual(bad.ok, false); assert.ok(bad.msg.includes("HYP_KEY"), bad.msg);
  payPage = "<html>תשלום</html>";
  r = await fetch(base + "/orders/payment/check", { headers: { "x-api-key": user } }); assert.strictEqual(r.status, 403);

  // unpaid orders stay visible to the admin (a customer who paid and closed the tab must not vanish)
  await OrderModel.create({ user_id: userId, items: [], total_price: 10, status: "awaiting_payment" });
  r = await fetch(base + "/orders", { headers: { "x-api-key": admin } });
  assert.ok((await r.json()).some((o) => o.status === "awaiting_payment"), "admin sees awaiting_payment");
  // the customer's own history: an opened-but-unpaid payment page is not an order, a charge under review is
  await OrderModel.create({ user_id: userId, items: [], total_price: 7, status: "awaiting_payment", payment: { provider: "hyp", status: "review" } });
  r = await fetch(base + `/orders/user/${userId}`, { headers: { "x-api-key": user } });
  const mine = await r.json();
  assert.ok(!mine.some((o) => o.status === "awaiting_payment" && o.payment?.status !== "review"), "unpaid attempt hidden from customer");
  assert.ok(mine.some((o) => o.payment?.status === "review"), "charge under review shown to customer");

  // Drive not configured: the admin page is told so, and the sync answers in plain Hebrew (no env var names)
  r = await fetch(base + `/orders/${order._id}`, { headers: { "x-api-key": admin } });
  assert.strictEqual((await r.json()).driveConfigured, false);
  r = await fetch(base + `/orders/${order._id}`, { headers: { "x-api-key": user } });
  assert.strictEqual((await r.json()).driveConfigured, undefined, "customers don't get the flag");
  r = await post(`/orders/${order._id}/drive`, {}, admin);
  const driveRes = await r.json();
  assert.strictEqual(r.status, 503); assert.strictEqual(driveRes.code, "DRIVE_NOT_CONFIGURED"); assert.ok(!/GOOGLE_DRIVE/.test(driveRes.msg));

  console.log("PAYMENT TESTS PASSED");
  server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
