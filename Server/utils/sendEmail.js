const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { config } = require("../config/secret");

let etherealAccount = null;

const hasEmailCredentials = () => Boolean(config.EMAIL_USER && config.EMAIL_PASS);

exports.hasEmailCredentials = hasEmailCredentials;

const getEtherealAccount = async () => {
  if (!etherealAccount) {
    etherealAccount = await nodemailer.createTestAccount();
    console.log("[Email] Using Ethereal test account for development:", etherealAccount.user);
  }
  return etherealAccount;
};

const createTransporter = async () => {
  if (hasEmailCredentials()) {
    return {
      transporter: nodemailer.createTransport({
        host: config.SMTP_HOST || "smtp.gmail.com",
        port: 465,         // שונה ל-465 (פורט מאובטח של גוגל)
        secure: true,      // שונה ל-true כי פורט 465 דורש חיבור SSL מאובטח
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS,
        },
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
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    from: `"FlashShop" <${testAccount.user}>`,
    isEthereal: true,
  };
};

exports.sendEmail = async (email, subject, payload, template, attachments = []) => {
  try {
    const { transporter, from, isEthereal } = await createTransporter();

    const templatePath = path.resolve(__dirname, template);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templatePath}`);
    }

    const source = fs.readFileSync(templatePath, "utf8");
    const compiledTemplate = handlebars.compile(source);

    const mailOptions = {
      from,
      subject,
      html: compiledTemplate(payload),
      attachments,
    };

    if (Array.isArray(email)) {
      mailOptions.bcc = email;
    } else {
      mailOptions.to = email;
      console.log("Sending email to:", email);
    }

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;

    if (previewUrl) {
      console.log("[Email] Preview URL:", previewUrl);
    } else {
      console.log("Email sent successfully:", info?.messageId);
    }

    return { success: true, info, previewUrl, isEthereal };
  } catch (error) {
    console.error("sendEmail error:", error);
    throw error;
  }
};