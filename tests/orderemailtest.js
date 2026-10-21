// Order status emails against an in-memory MongoDB (mail goes to an Ethereal test inbox).
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");

const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));

(async () => {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongod.getUri();
    process.env.JWT_SECRET = "test-secret";
    delete process.env.EMAIL_USER; delete process.env.EMAIL_PASS;

    const mongoose = req("mongoose");
    const express = req("express");
    const cookieParser = req("cookie-parser");
    const jwt = req("jsonwebtoken");
    await mongoose.connect(process.env.MONGO_URL);

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/orders", require(path.join(SERVER, "routes/ordersRoutes")));
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}`;
    const admin = jwt.sign({ _id: new mongoose.Types.ObjectId().toString(), role: "admin" }, process.env.JWT_SECRET);
    const call = (m, p, body, token = admin) => fetch(base + p, {
        method: m, headers: { "Content-Type": "application/json", "x-api-key": token }, body: body ? JSON.stringify(body) : undefined,
    });

    // templates are created with defaults on first read
    let r = await call("GET", "/orders/email-templates"); assert.strictEqual(r.status, 200);
    let data = await r.json();
    assert.deepStrictEqual(data.templates.map((t) => t.status), ["processing", "shipped", "delivered", "cancelled"]);
    assert.ok(data.placeholders.some((p) => p.key === "orderNumber"));

    // edit one
    r = await call("PUT", "/orders/email-templates/delivered", { subject: "מוכן! {{orderNumber}}", body: "היי {{name}}, לאסוף בין 9 ל-5", enabled: true });
    assert.strictEqual(r.status, 200); assert.strictEqual((await r.json()).subject, "מוכן! {{orderNumber}}");
    r = await call("PUT", "/orders/email-templates/bogus", { subject: "x", body: "y" }); assert.strictEqual(r.status, 404);
    r = await call("PUT", "/orders/email-templates/shipped", { subject: "", body: "y" }); assert.strictEqual(r.status, 400);
    r = await call("GET", "/orders/email-templates", null, jwt.sign({ _id: "1", role: "user" }, process.env.JWT_SECRET)); assert.strictEqual(r.status, 403);

    // an order with a customer email -> status change sends mail (Ethereal) and updates status
    const { OrderModel } = require(path.join(SERVER, "models/ordersModel"));
    const order = await OrderModel.create({
        items: [{ name: "ספל", quantity: 2, price: 30 }], total_price: 60, fulfillment_method: "pickup",
        customer: { name: "רבקי", email: "customer@example.com" }, status: "processing",
    });
    const { renderTemplate } = require(path.join(SERVER, "services/orderEmailService"));
    assert.strictEqual(renderTemplate("הזמנה {{orderNumber}} של {{name}} {{unknown}}", { orderNumber: "AB12", name: "רבקי" }), "הזמנה AB12 של רבקי {{unknown}}");

    r = await call("PUT", `/orders/${order._id}/status`, { status: "delivered" });
    assert.strictEqual(r.status, 200); assert.strictEqual((await r.json()).status, "delivered");
    r = await call("PUT", `/orders/${order._id}/status`, { status: "nope" }); assert.strictEqual(r.status, 400);

    // disabled template -> no mail, status still updates
    await call("PUT", "/orders/email-templates/cancelled", { subject: "x", body: "y", enabled: false });
    r = await call("PUT", `/orders/${order._id}/status`, { status: "cancelled" }); assert.strictEqual(r.status, 200);

    console.log("ORDER EMAIL TESTS PASSED");
    server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
