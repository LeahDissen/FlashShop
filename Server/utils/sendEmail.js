const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { config } = require("../config/secret");

// SMTP שלא עונה לא אמור להחזיק בקשה דקות ארוכות (ברירת המחדל של nodemailer היא 2 דקות)
const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };
const HTTP_TIMEOUT_MS = 15_000;

let etherealAccount = null;

const hasEmailCredentials = () => Boolean(config.EMAIL_USER && config.EMAIL_PASS);
const usesHttpProvider = () => Boolean(config.EMAIL_PROVIDER && config.EMAIL_API_KEY);

exports.hasEmailCredentials = () => usesHttpProvider() || hasEmailCredentials();

const getEtherealAccount = async () => {
  if (!etherealAccount) {
    etherealAccount = await nodemailer.createTestAccount();
    console.log("[Email] Using Ethereal test account for development:", etherealAccount.user);
  }
  return etherealAccount;
};

const createSmtpTransport = async () => {
  if (hasEmailCredentials()) {
    const port = Number(config.SMTP_PORT) || 465;
    return {
      transporter: nodemailer.createTransport({
        host: config.SMTP_HOST || "smtp.gmail.com",
        port,
        secure: port === 465,
        auth: { user: config.EMAIL_USER, pass: config.EMAIL_PASS },
        ...SMTP_TIMEOUTS,
      }),
      from: config.EMAIL_USER,
      isEthereal: false,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const testAccount = await getEtherealAccount();
  return {
    transporter: nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
      ...SMTP_TIMEOUTS,
    }),
    from: `"FlashShop" <${testAccount.user}>`,
    isEthereal: true,
  };
};

const toBase64 = (content) => Buffer.from(content).toString("base64");

/** מתאמים לספקי מייל מבוססי HTTP — כל אחד ממיר הודעה אחידה לפורמט של הספק */
const HTTP_PROVIDERS = {
  brevo: ({ from, fromName, to, bcc, subject, html, attachments }) => ({
    url: "https://api.brevo.com/v3/smtp/email",
    headers: { "api-key": config.EMAIL_API_KEY },
    body: {
      sender: { email: from, name: fromName },
      to: to.map((email) => ({ email })),
      ...(bcc.length ? { bcc: bcc.map((email) => ({ email })) } : {}),
      subject,
      htmlContent: html,
      ...(attachments.length
        ? { attachment: attachments.map((a) => ({ name: a.filename, content: toBase64(a.content) })) }
        : {}),
    },
  }),
  resend: ({ from, fromName, to, bcc, subject, html, attachments }) => ({
    url: "https://api.resend.com/emails",
    headers: { Authorization: `Bearer ${config.EMAIL_API_KEY}` },
    body: {
      from: fromName ? `${fromName} <${from}>` : from,
      to,
      ...(bcc.length ? { bcc } : {}),
      subject,
      html,
      ...(attachments.length
        ? { attachments: attachments.map((a) => ({ filename: a.filename, content: toBase64(a.content) })) }
        : {}),
    },
  }),
};

const sendViaHttpProvider = async (message) => {
  const buildRequest = HTTP_PROVIDERS[config.EMAIL_PROVIDER];
  if (!buildRequest) throw new Error(`Unknown EMAIL_PROVIDER: ${config.EMAIL_PROVIDER}`);

  const { url, headers, body } = buildRequest({
    ...message,
    from: config.EMAIL_FROM || config.EMAIL_USER,
    fromName: config.EMAIL_FROM_NAME || "FlashShop",
  });
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Email provider ${config.EMAIL_PROVIDER} responded ${response.status}: ${details.slice(0, 300)}`);
  }
  return { info: await response.json().catch(() => ({})), isEthereal: false, previewUrl: null };
};

const sendViaSmtp = async ({ to, bcc, subject, html, attachments }) => {
  const { transporter, from, isEthereal } = await createSmtpTransport();
  // ב-BCC הנמען הגלוי הוא השולח עצמו, כדי שהכתובות לא ייחשפו זו לזו
  const info = await transporter.sendMail({
    from,
    to: to.length ? to : from,
    ...(bcc.length ? { bcc } : {}),
    subject,
    html,
    attachments,
  });
  return { info, isEthereal, previewUrl: isEthereal ? nodemailer.getTestMessageUrl(info) : null };
};

const renderTemplate = (template, payload) => {
  const templatePath = path.resolve(__dirname, template);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templatePath}`);
  }
  return handlebars.compile(fs.readFileSync(templatePath, "utf8"))(payload);
};

/**
 * שולח מייל לפי תבנית handlebars. מערך נמענים נשלח ב-BCC.
 * זורק שגיאה בכישלון.
 */
exports.sendEmail = async (email, subject, payload, template, attachments = []) => {
  try {
    const recipients = Array.isArray(email) ? { to: [], bcc: email } : { to: [email], bcc: [] };
    const message = { ...recipients, subject, html: renderTemplate(template, payload), attachments };
    console.log("Sending email to:", Array.isArray(email) ? `${email.length} recipients (bcc)` : email);

    const result = usesHttpProvider() ? await sendViaHttpProvider(message) : await sendViaSmtp(message);
    if (result.previewUrl) {
      console.log("[Email] Preview URL:", result.previewUrl);
    } else {
      console.log("Email sent successfully:", result.info?.messageId || result.info?.id || "");
    }
    return { success: true, ...result };
  } catch (error) {
    console.error("sendEmail error:", error.message);
    throw error;
  }
};
