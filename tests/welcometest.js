// Club welcome mail: admin-edited subject/body/attachment from the 'club' page, in-memory Mongo + Ethereal.
const path = require("path");
const http = require("http");
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
    const nodemailer = req("nodemailer");
    await mongoose.connect(process.env.MONGO_URL);

    // capture what sendEmail hands to nodemailer
    const sent = [];
    const realCreate = nodemailer.createTransport;
    nodemailer.createTransport = () => ({ sendMail: async (opts) => { sent.push(opts); return { messageId: "x" }; } });
    nodemailer.createTestAccount = async () => ({ user: "t@e", pass: "p", smtp: { host: "h", port: 1, secure: false } });

    // a tiny "PDF" host
    const pdfServer = http.createServer((_, res) => { res.setHeader("Content-Type", "application/pdf"); res.end(Buffer.from("%PDF-1.4 test")); }).listen(0);
    const pdfUrl = `http://127.0.0.1:${pdfServer.address().port}/guide.pdf`;

    const { PageModel } = require(path.join(SERVER, "models/pageModel"));
    const app = express(); app.use(express.json());
    app.use("/club", require(path.join(SERVER, "routes/clubRoutes")));
    const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}`;
    // the welcome email is sent in the background after the 201 response
    const waitForSent = async (n) => { for (let i = 0; i < 100 && sent.length < n; i++) await new Promise((r) => setTimeout(r, 20)); };
    const join = (email) => fetch(base + "/club/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "רבקי", email, birthDate: "2000-01-01" }) });

    // 1) no settings, join gift off -> default template without the code box, no attachment
    let r = await join("a@example.com"); assert.strictEqual(r.status, 201); await waitForSent(1);
    assert.strictEqual(sent.length, 1); assert.strictEqual(sent[0].subject, "ברוכים הבאים למועדון! 🎁");
    assert.ok(!sent[0].html.includes("GIFT-") && !sent[0].html.includes("קוד ההטבה"), "no empty code box");
    assert.deepStrictEqual(sent[0].attachments, []);

    // 2) admin text + pdf, gift still off -> the {{code}} line is left out, the rest is sent
    await PageModel.create({ key: "club", data: { welcomeSubject: "היי {{name}}!", welcomeBody: "הקוד שלך: {{code}}\nתודה", welcomeAttachmentUrl: pdfUrl } });
    r = await join("b0@example.com"); assert.strictEqual(r.status, 201); await waitForSent(2);
    assert.ok(sent[1].html.includes("תודה") && !sent[1].html.includes("הקוד שלך"), "code line left out");
    sent.splice(0, 2);

    // with the join gift on: the welcome mail has no code, a confirmation mail asks to confirm the address,
    // and only the confirmation link sends the gift code
    const { ShopSettingsModel } = require(path.join(SERVER, "models/shopSettingsModel"));
    const { ClubModel } = require(path.join(SERVER, "models/clubModel"));
    await ShopSettingsModel.updateOne({ key: "default" }, { $set: { clubGift: { enabled: true, productId: "507f1f77bcf86cd799439011", discountType: "percent", value: 100 } } }, { upsert: true });
    r = await join("b@example.com"); assert.strictEqual(r.status, 201);
    const joined = await r.json(); assert.strictEqual(joined.code, null); assert.strictEqual(joined.pendingGift, true);
    await waitForSent(2);
    const m = sent.find((mail) => mail.subject === "היי רבקי!");
    const confirmMail = sent.find((mail) => /אישור המייל/.test(mail.subject));
    assert.ok(!/GIFT-/.test(m.html) && !m.html.includes("הקוד שלך"), "no code before confirming");
    const pending = await ClubModel.findOne({ email: "b@example.com" }).lean();
    assert.strictEqual(pending.giftType, "pending-gift");
    assert.ok(confirmMail.html.includes(`/club/confirm/${pending.verifyToken}`), "confirmation link in the mail");
    assert.strictEqual((await fetch(`${base}/club/check/${pending.giftCode}`).then((x) => x.json())).valid, false, "code not usable before confirming");
    sent.length = 0;
    r = await fetch(`${base}/club/confirm/${pending.verifyToken}`); assert.strictEqual(r.status, 200);
    await waitForSent(1);
    assert.ok(sent[0].html.includes(pending.giftCode), "gift mail with the code after confirming");
    const confirmed = await ClubModel.findOne({ email: "b@example.com" }).lean();
    assert.strictEqual(confirmed.giftType, "join-gift"); assert.strictEqual(confirmed.verifyToken, undefined);
    r = await fetch(`${base}/club/confirm/${pending.verifyToken}`); assert.strictEqual(r.status, 400, "link works once");
    r = await fetch(`${base}/club/confirm/nope`); assert.strictEqual(r.status, 400);
    sent.splice(0, sent.length, m);
    assert.strictEqual(m.subject, "היי רבקי!");
    assert.strictEqual(m.attachments.length, 1); assert.strictEqual(m.attachments[0].filename, "guide.pdf");
    assert.ok(m.attachments[0].content.toString().startsWith("%PDF"));

    // 3) broken attachment url -> mail still goes, without attachment
    await PageModel.updateOne({ key: "club" }, { $set: { "data.welcomeAttachmentUrl": "http://127.0.0.1:1/nope.pdf" } });
    r = await join("c@example.com"); assert.strictEqual(r.status, 201); await waitForSent(3);
    assert.strictEqual(sent.find((mail, i) => i > 0 && mail.subject === "היי רבקי!").attachments.length, 0);

    nodemailer.createTransport = realCreate;
    console.log("WELCOME MAIL TESTS PASSED");
    server.close(); pdfServer.close(); await mongoose.disconnect(); await mongod.stop(); process.exit(0);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
