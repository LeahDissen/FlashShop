// Functional test of the new /pages API against an in-memory MongoDB.
const path = require("path");
const assert = require("assert");
const { MongoMemoryServer } = require("mongodb-memory-server");

const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const req = (m) => require(path.join(SERVER, "node_modules", m));

(async () => {
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongod.getUri();
    process.env.JWT_SECRET = "test-secret";
    process.env.PORT = "0";

    const mongoose = req("mongoose");
    const express = req("express");
    const cookieParser = req("cookie-parser");
    const jwt = req("jsonwebtoken");
    await mongoose.connect(process.env.MONGO_URL);

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/pages", require(path.join(SERVER, "routes/pagesRoutes")));
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}`;
    const admin = jwt.sign({ _id: "1", role: "admin" }, process.env.JWT_SECRET);
    const user = jwt.sign({ _id: "2", role: "user" }, process.env.JWT_SECRET);

    const call = (m, p, body, token) => fetch(base + p, {
        method: m,
        headers: { "Content-Type": "application/json", ...(token ? { "x-api-key": token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });

    // empty page -> {}
    let r = await call("GET", "/pages/home");
    assert.strictEqual(r.status, 200); assert.deepStrictEqual(await r.json(), {});

    // unknown key -> 404
    r = await call("GET", "/pages/nope"); assert.strictEqual(r.status, 404);

    // PUT without token -> 401, with user token -> 403
    r = await call("PUT", "/pages/home", { title: "x" }); assert.strictEqual(r.status, 401);
    r = await call("PUT", "/pages/home", { title: "x" }, user); assert.strictEqual(r.status, 403);

    // admin PUT creates, second PUT merges (hset semantics), undefined-filtered, JSON strings kept as-is
    r = await call("PUT", "/pages/home", { title: "ברוכים הבאים", products: JSON.stringify([{ name: "מגנטים" }]) }, admin);
    assert.deepStrictEqual(await r.json(), { success: true, updatedFields: ["title", "products"] });
    r = await call("PUT", "/pages/home", { mainImg: "https://x/y.png" }, admin);
    assert.strictEqual(r.status, 200);
    r = await call("GET", "/pages/home");
    const home = await r.json();
    assert.deepStrictEqual(home, { title: "ברוכים הבאים", products: '[{"name":"מגנטים"}]', mainImg: "https://x/y.png" });

    // empty body -> no-op success
    r = await call("PUT", "/pages/footer", {}, admin);
    assert.deepStrictEqual(await r.json(), { success: true, updatedFields: [] });
    r = await call("GET", "/pages/footer"); assert.deepStrictEqual(await r.json(), {});

    // product-categories key works (has a dash)
    r = await call("PUT", "/pages/product-categories", { customCategories: "[]", hiddenCategories: "[]" }, admin);
    assert.strictEqual(r.status, 200);
    r = await call("GET", "/pages/product-categories");
    assert.deepStrictEqual(await r.json(), { customCategories: "[]", hiddenCategories: "[]" });

    // cookie auth path too
    r = await fetch(base + "/pages/cart", { method: "PUT", headers: { "Content-Type": "application/json", Cookie: `authToken=${admin}` }, body: JSON.stringify({ title: "סל" }) });
    assert.strictEqual(r.status, 200);

    console.log("ALL PAGES TESTS PASSED");
    server.close(); await mongoose.disconnect(); await mongod.stop();
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
