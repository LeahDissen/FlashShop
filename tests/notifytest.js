// Shop owner alerts (new order, contact message) and the reply-to address, in-memory Mongo + captured mail.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");

const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));

(async () => {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongod.getUri();
    process.env.JWT_SECRET = "test-secret";
    delete process.env.EMAIL_USER; delete process.env.EMAIL_PASS; delete process.env.USER; delete process.env.PASS;

    const mongoose = req("mongoose");
    const express = req("express");
    const cookieParser = req("cookie-parser");
    const jwt = req("jsonwebtoken");
    const nodemailer = req("nodemailer");
    await mongoose.connect(process.env.MONGO_URL);

    const sent = [];
    nodemailer.createTransport = () => ({ sendMail: async (opts) => { sent.push({ ...opts, to: [].concat(opts.to)[0] }); return { messageId: "x" }; } });
    nodemailer.createTestAccount = async () => ({ user: "t@e", pass: "p", smtp: { host: "h", port: 1, secure: false } });
    const waitForSent = async (n) => { for (let i = 0; i < 100 && sent.length < n; i++) await new Promise((r) => setTimeout(r, 20)); };

    const app = express(); app.use(express.json()); app.use(cookieParser());
    app.use("/shop-settings", require(path.join(SERVER, "routes/shopSettingsRoutes")));
    app.use("/contact", require(path.join(SERVER, "routes/contactRoutes")));
    const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
    const admin = jwt.sign({ _id: new mongoose.Types.ObjectId().toString(), role: "admin" }, process.env.JWT_SECRET);
    const user = jwt.sign({ _id: new mongoose.Types.ObjectId().toString(), role: "user" }, process.env.JWT_SECRET);
    const call = (m, p, body, token) => fetch(base + p, {
        method: m, headers: { "Content-Type": "application/json", ...(token ? { "x-api-key": token } : {}) }, body: body ? JSON.stringify(body) : undefined,
    });
    const message = { name: "דנה", email: "dana@example.com", message: "יש לכם מגנטים גדולים?" };

    // no address set: a message is saved and nobody is alerted
    let r = await call("POST", "/contact", message); assert.strictEqual(r.status, 200);
    await new Promise((resolve) => setTimeout(resolve, 200)); assert.strictEqual(sent.length, 0);

    // the email settings are for the admin only, and never in the public settings
    assert.strictEqual((await call("GET", "/shop-settings/email")).status, 401);
    assert.strictEqual((await call("GET", "/shop-settings/email", null, user)).status, 403);
    r = await call("PUT", "/shop-settings/email", { notifications: { email: "not-an-email" } }, admin); assert.strictEqual(r.status, 400);
    r = await call("PUT", "/shop-settings/email", { notifications: { email: " Michal@Example.com ", newOrder: true, newMessage: true }, replyToEmail: "shop@example.com" }, admin);
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual(await r.json(), { notifications: { email: "michal@example.com", newOrder: true, newMessage: true }, replyToEmail: "shop@example.com" });
    const publicSettings = await (await call("GET", "/shop-settings")).json();
    assert.ok(!("notifications" in publicSettings) && !("replyToEmail" in publicSettings), "not public");

    // a contact message alerts the owner; replying answers the customer
    r = await call("POST", "/contact", message); assert.strictEqual(r.status, 200);
    await waitForSent(1);
    assert.strictEqual(sent[0].to, "michal@example.com");
    assert.strictEqual(sent[0].replyTo, "dana@example.com");
    assert.ok(sent[0].subject.includes("דנה") && sent[0].html.includes("מגנטים"));

    // a completed order alerts the owner too
    const { completeOrder } = require(path.join(SERVER, "services/orderCompletionService"));
    const order = { _id: new mongoose.Types.ObjectId(), total_price: 120, fulfillment_method: "delivery", items: [{}, {}], customer: { name: "רון", email: "ron@example.com" } };
    sent.length = 0;
    await completeOrder(order, new mongoose.Types.ObjectId().toString());
    await waitForSent(2);
    const alert = sent.find((mail) => mail.to === "michal@example.com");
    assert.ok(alert, "order alert sent");
    assert.ok(alert.subject.startsWith("מחכה לכם הזמנה באתר") && alert.html.includes("120.00") && alert.html.includes(String(order._id)));
    assert.strictEqual(alert.replyTo, "ron@example.com");
    // the customer's own email replies to the shop's reply-to address
    const customerMail = sent.find((mail) => mail.to === "ron@example.com");
    if (customerMail) assert.strictEqual(customerMail.replyTo, "shop@example.com");

    // every email of the site replies to the shop's address, unless the caller sets its own
    const { sendEmail } = require(path.join(SERVER, "utils/sendEmail"));
    sent.length = 0;
    await sendEmail("x@example.com", "שלום", { title: "t", message: "m" }, "./template/generalMail.handlebars");
    assert.strictEqual(sent[0].replyTo, "shop@example.com");

    // alerts can be turned off
    await call("PUT", "/shop-settings/email", { notifications: { email: "michal@example.com", newOrder: true, newMessage: false }, replyToEmail: "" }, admin);
    sent.length = 0;
    await call("POST", "/contact", message);
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert.strictEqual(sent.length, 0, "message alert off");

    console.log("NOTIFY TESTS PASSED");
    server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
