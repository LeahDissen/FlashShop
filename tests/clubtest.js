// Club join flow against an in-memory MongoDB: asserts, then keeps serving on :10200 for browser checks.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");

const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));

(async () => {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongod.getUri();
    process.env.JWT_SECRET = "test-secret";
    delete process.env.EMAIL_USER; delete process.env.EMAIL_PASS; // no real mail: Ethereal test account

    const mongoose = req("mongoose");
    const express = req("express");
    const cors = req("cors");
    await mongoose.connect(process.env.MONGO_URL);

    const app = express();
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(req("cookie-parser")());
    app.use("/club", require(path.join(SERVER, "routes/clubRoutes")));
    app.use("/auth", require(path.join(SERVER, "routes/authRoutes")));
    app.use("/pages", (req, res) => res.json({}));
    const server = app.listen(10200);
    const base = "http://127.0.0.1:10200";
    const join = (body) => fetch(base + "/club/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    // the join gift is off by default: the signup is saved without a benefit code
    let r = await join({ name: "בדיקה", email: "Test@Example.com", birthDate: "2000-01-01" });
    assert.strictEqual(r.status, 201); const first = await r.json(); assert.strictEqual(first.code, null);
    // with the gift on, the new member gets a personal code
    const { ShopSettingsModel } = require(path.join(SERVER, "models/shopSettingsModel"));
    await ShopSettingsModel.updateOne({ key: "default" }, { $set: { clubGift: { enabled: true, productId: "507f1f77bcf86cd799439011", discountType: "percent", value: 100 } } }, { upsert: true });
    r = await join({ name: "מתנה", email: "gift@example.com", birthDate: "2000-01-01" });
    assert.strictEqual(r.status, 201);
    const pendingJoin = await r.json(); assert.strictEqual(pendingJoin.code, null); assert.strictEqual(pendingJoin.pendingGift, true);
    r = await join({ name: "בדיקה", email: "test@example.com", birthDate: "2000-01-01" }); // same email, different case
    assert.strictEqual(r.status, 409); const dup = await r.json(); assert.strictEqual(dup.code, "ALREADY_MEMBER");
    r = await join({ name: "", email: "" }); assert.strictEqual(r.status, 400);
    // a member saved by the old code with mixed case is still detected
    const { ClubModel } = require(path.join(SERVER, "models/clubModel"));
    await ClubModel.collection.insertOne({ name: "ותיקה", email: "Legacy@Example.com", giftCode: "GIFT-OLD", isUsed: false });
    r = await join({ name: "ותיקה", email: "Legacy@Example.com", birthDate: "2000-01-01" }); assert.strictEqual(r.status, 409);
    // the logged-in customer's status, by her account email (any letter case)
    const jwt = req("jsonwebtoken");
    const { UserModel } = require(path.join(SERVER, "models/userModel"));
    const status = async (email) => {
        const user = await UserModel.create({ name: "x", email, password: "hashed-x" });
        const token = jwt.sign({ _id: user._id, role: "user" }, process.env.JWT_SECRET);
        return fetch(base + "/club/me", { headers: { "x-api-key": token } }).then((x) => x.json());
    };
    assert.deepStrictEqual(await status("GIFT@example.com"), { isMember: true, giftAvailable: false, giftPending: true });
    await ClubModel.updateOne({ email: "gift@example.com" }, { $set: { giftType: "join-gift" }, $unset: { verifyToken: 1 } });
    assert.deepStrictEqual(await status("gift@example.com".replace("gift", "Gift")), { isMember: true, giftAvailable: true, giftPending: false });
    assert.deepStrictEqual(await status("nobody@example.com"), { isMember: false, giftAvailable: false, giftPending: false });
    assert.strictEqual((await fetch(base + "/club/me")).status, 401, "needs a login");
    console.log("CLUB TESTS PASSED");
    if (!process.env.KEEP_SERVING) { server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0); }
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
