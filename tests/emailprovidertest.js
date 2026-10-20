// sendEmail: HTTP providers build correct requests; SMTP timeout is short.
const assert = require("assert");
const path = require("path");
const SERVER = process.env.SERVER || path.resolve(__dirname, "../Server");
const fresh = (env) => {
  for (const k of ["EMAIL_PROVIDER","EMAIL_API_KEY","EMAIL_FROM","EMAIL_FROM_NAME","EMAIL_USER","EMAIL_PASS","SMTP_HOST","SMTP_PORT","USER","PASS"]) delete process.env[k];
  Object.assign(process.env, env);
  for (const k of Object.keys(require.cache)) if (k.includes("/Server/") && !k.includes("node_modules")) delete require.cache[k];
  return require(path.join(SERVER, "utils/sendEmail"));
};
const TEMPLATE = "./template/generalMail.handlebars";
(async () => {
  const calls = [];
  global.fetch = async (url, opts) => { calls.push({ url, opts, body: JSON.parse(opts.body) }); return { ok: true, json: async () => ({ messageId: "m1" }) }; };

  let m = fresh({ EMAIL_PROVIDER: "brevo", EMAIL_API_KEY: "k", EMAIL_FROM: "shop@flaash.co.il" });
  await m.sendEmail("a@b.com", "שלום", { title: "t", message: "m" }, TEMPLATE, [{ filename: "g.pdf", content: Buffer.from("PDF") }]);
  let c = calls.pop();
  assert.strictEqual(c.url, "https://api.brevo.com/v3/smtp/email");
  assert.strictEqual(c.opts.headers["api-key"], "k");
  assert.deepStrictEqual(c.body.to, [{ email: "a@b.com" }]);
  assert.strictEqual(c.body.sender.email, "shop@flaash.co.il");
  assert.strictEqual(c.body.attachment[0].content, Buffer.from("PDF").toString("base64"));
  assert.ok(c.body.htmlContent.length > 0 && !("bcc" in c.body));

  m = fresh({ EMAIL_PROVIDER: "resend", EMAIL_API_KEY: "k2", EMAIL_FROM: "shop@flaash.co.il", EMAIL_FROM_NAME: "פלאש" });
  await m.sendEmail(["x@y.com", "z@y.com"], "s", { title: "t", message: "m" }, TEMPLATE);
  c = calls.pop();
  assert.strictEqual(c.url, "https://api.resend.com/emails");
  assert.strictEqual(c.opts.headers.Authorization, "Bearer k2");
  assert.deepStrictEqual(c.body.bcc, ["x@y.com", "z@y.com"]);
  assert.deepStrictEqual(c.body.to, ["shop@flaash.co.il"]);
  assert.strictEqual(c.body.from, "פלאש <shop@flaash.co.il>");

  global.fetch = async () => ({ ok: false, status: 401, text: async () => "bad key" });
  await assert.rejects(m.sendEmail("a@b.com", "s", {}, TEMPLATE), /401/);

  // SMTP to an unroutable host fails fast (well under the old 2 minutes)
  m = fresh({ EMAIL_USER: "u@gmail.com", EMAIL_PASS: "p", SMTP_HOST: "10.255.255.1", SMTP_PORT: "465" });
  const t0 = Date.now();
  await assert.rejects(m.sendEmail("a@b.com", "s", {}, TEMPLATE), /timeout/i);
  const secs = (Date.now() - t0) / 1000;
  assert.ok(secs < 15, `smtp failed after ${secs}s`);

  console.log(`EMAIL PROVIDER TESTS PASSED (smtp failed fast in ${secs.toFixed(1)}s)`);
})().catch((e) => { console.error("FAIL:", e); process.exit(1); });
