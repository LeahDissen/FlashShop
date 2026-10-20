// Club mailing: broadcast report, selected recipients, unsubscribe, manual add/remove — in-memory Mongo + Ethereal.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");

const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));

(async () => {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongod.getUri();
    process.env.JWT_SECRET = "test-secret";
    process.env.CLIENT_URL = "https://flaash.co.il,https://www.flaash.co.il";
    delete process.env.EMAIL_USER; delete process.env.EMAIL_PASS;

    const mongoose = req("mongoose");
    const express = req("express");
    const cookieParser = req("cookie-parser");
    const jwt = req("jsonwebtoken");
    await mongoose.connect(process.env.MONGO_URL);

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/club", require(path.join(SERVER, "routes/clubRoutes")));
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}`;
    const admin = jwt.sign({ _id: "1", role: "admin" }, process.env.JWT_SECRET);
    const call = (m, p, body, token = admin) => fetch(base + p, {
        method: m, headers: { "Content-Type": "application/json", "x-api-key": token }, body: body ? JSON.stringify(body) : undefined,
    });

    const { getClientUrl } = require(path.join(SERVER, "utils/clientUrl"));
    assert.strictEqual(getClientUrl(), "https://flaash.co.il");

    // manual add (+validation, +duplicate), a bad address straight in the DB, delete
    let r = await call("POST", "/club/members", { name: "אחת", email: "One@Example.com", birthDate: "1990-05-05" }); assert.strictEqual(r.status, 201);
    const one = await r.json(); assert.strictEqual(one.email, "one@example.com"); assert.match(one.giftCode, /^GIFT-/);
    r = await call("POST", "/club/members", { name: "אחת", email: "one@example.com" }); assert.strictEqual(r.status, 409);
    r = await call("POST", "/club/members", { name: "", email: "bad" }); assert.strictEqual(r.status, 400);
    r = await call("POST", "/club/members", { name: "שתיים", email: "two@example.com" }); const two = await r.json();
    r = await call("POST", "/club/members", { name: "שלוש", email: "three@example.com" }); const three = await r.json();
    const { ClubModel } = require(path.join(SERVER, "models/clubModel"));
    const bad = await ClubModel.create({ name: "שבור", email: "not-an-email", giftCode: "GIFT-BAD" });

    // unsubscribe link: wrong token rejected, right token flips the flag
    const { createUnsubscribeToken } = require(path.join(SERVER, "utils/unsubscribeToken"));
    r = await fetch(`${base}/club/unsubscribe/${three._id}/deadbeef`); assert.strictEqual(r.status, 400);
    r = await fetch(`${base}/club/unsubscribe/${three._id}/${createUnsubscribeToken(three._id)}`);
    assert.strictEqual(r.status, 200); assert.ok((await r.text()).includes("הוסרת מרשימת התפוצה"));
    assert.strictEqual((await ClubModel.findById(three._id)).unsubscribed, true);

    // members list exposes the flag
    r = await call("GET", "/club/members"); const members = await r.json();
    assert.strictEqual(members.find((m) => m._id === String(three._id)).unsubscribed, true);

    // broadcast to all: 2 sent (one, two), three unsubscribed, bad skipped
    r = await call("POST", "/club/broadcast", { subject: "מבצע", message: "שלום" }); assert.strictEqual(r.status, 200);
    let report = await r.json();
    assert.strictEqual(report.sent, 2); assert.deepStrictEqual(report.skipped, ["not-an-email"]); assert.deepStrictEqual(report.failed, []);

    // selected only
    r = await call("POST", "/club/broadcast", { subject: "x", message: "y", recipientType: "selected", memberIds: JSON.stringify([two._id]) });
    report = await r.json(); assert.strictEqual(report.sent, 1);
    r = await call("POST", "/club/broadcast", { subject: "x", message: "y", recipientType: "selected", memberIds: "[]" }); assert.strictEqual(r.status, 400);

    // delete
    r = await call("DELETE", `/club/members/${bad._id}`); assert.strictEqual(r.status, 200);
    r = await call("DELETE", `/club/members/${bad._id}`); assert.strictEqual(r.status, 404);
    r = await call("GET", "/club/members", null, jwt.sign({ _id: "2", role: "user" }, process.env.JWT_SECRET)); assert.strictEqual(r.status, 403);

    console.log("CLUB MAIL TESTS PASSED");
    server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
