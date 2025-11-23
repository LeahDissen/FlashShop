const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { config } = require("../config/secret");

exports.sendEmail = async (email, subject, payload, template) => {
  try {
    console.log("inside send email");


    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS, // App password
      },
      tls: {
        rejectUnauthorized: false // Only for development
      }
    });

    console.log('sending to:', email);

    const templatePath = path.resolve(__dirname, template);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templatePath}`);
    }

    const source = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(source);

    const mailOptions = {
      from: process.env.USER,
      to: email,
      subject,
      html: compiledTemplate(payload),
    };

    // sendMail returns a promise in modern nodemailer versions
    const info = await transporter.sendMail(mailOptions);
    console.log('email sent:', info && info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('sendEmail error:', error);
    // rethrow so callers can handle the error and respond appropriately
    throw error;
  }
};

