const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { config } = require("../config/secret");

exports.sendEmail = async (email, subject, payload, template, attachments = []) => {
  try {
        console.log("inside send email");


    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.USER,
        pass: config.PASS,
      },
      tls: {
        rejectUnauthorized: false
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
      attachments: attachments // העברת הקבצים למייל
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('email sent:', info && info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('sendEmail error:', error);
    throw error;
  }
};
