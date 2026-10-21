// Popups API: CRUD (admin only) + active filter by page/date/active flag.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");

const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));

(async () => {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongod.getUri();
    process.env.JWT_SECRET = "test-secret";
    const mongoose = req("mongoose"); const express = req("express"); const cookieParser = req("cookie-parser"); const jwt = req("jsonwebtoken");
    await mongoose.connect(process.env.MONGO_URL);
    const app = express(); app.use(express.json()); app.use(cookieParser());
    app.use("/popups", require(path.join(SERVER, "routes/popupsRoutes")));
    const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
    const admin = jwt.sign({ _id: "1", role: "admin" }, process.env.JWT_SECRET);
    const call = (m, p, body, token = admin) => fetch(base + p, { method: m, headers: { "Content-Type": "application/json", ...(token ? { "x-api-key": token } : {}) }, body: body ? JSON.stringify(body) : undefined });

    let r = await call("POST", "/popups", { title: "" }); assert.strictEqual(r.status, 400);
    r = await call("POST", "/popups", { title: "x", ctaUrl: "javascript:alert(1)" }); assert.strictEqual(r.status, 400);
    r = await call("POST", "/popups", { title: "x" }, null); assert.strictEqual(r.status, 401);

    r = await call("POST", "/popups", { title: "כל האתר", delaySeconds: 2 }); assert.strictEqual(r.status, 201); const all = await r.json();
    r = await call("POST", "/popups", { title: "רק מוצרים", pages: ["products", "/cart/"], ctaText: "לקנות", ctaUrl: "/products" }); const prod = await r.json();
    assert.deepStrictEqual(prod.pages, ["/products", "/cart"], "paths normalized");
    r = await call("POST", "/popups", { title: "פג תוקף", endsAt: "2020-01-01" }); const expired = await r.json();
    r = await call("POST", "/popups", { title: "עתידי", startsAt: "2099-01-01" }); await r.json();
    r = await call("POST", "/popups", { title: "כבוי", isActive: false }); const off = await r.json();

    const active = async (p) => (await (await fetch(`${base}/popups/active?path=${encodeURIComponent(p)}`)).json()).map((x) => x.title);
    assert.deepStrictEqual(await active("/"), ["כל האתר"]);
    assert.deepStrictEqual((await active("/products")).sort(), ["כל האתר", "רק מוצרים"].sort());
    assert.deepStrictEqual(await active("/tips"), ["כל האתר"]);
    assert.ok(!(await active("/")).includes("פג תוקף") && !(await active("/")).includes("עתידי") && !(await active("/")).includes("כבוי"));

    // public payload has no admin-only fields; update clears a date; delete
    const pub = (await (await fetch(`${base}/popups/active?path=/`)).json())[0];
    assert.ok(!("pages" in pub) && !("isActive" in pub));
    r = await call("PUT", `/popups/${expired._id}`, { title: "כבר לא פג", endsAt: null }); assert.strictEqual(r.status, 200);
    assert.ok((await active("/")).includes("כבר לא פג"));
    r = await call("PUT", `/popups/${off._id}`, { title: "x", startsAt: "2030-01-01", endsAt: "2029-01-01" }); assert.strictEqual(r.status, 400);
    r = await call("DELETE", `/popups/${all._id}`); assert.strictEqual(r.status, 200);
    r = await call("DELETE", `/popups/${all._id}`); assert.strictEqual(r.status, 404);
    r = await call("GET", "/popups", null, jwt.sign({ _id: "2", role: "user" }, process.env.JWT_SECRET)); assert.strictEqual(r.status, 403);

    console.log("POPUP TESTS PASSED");
    server.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
