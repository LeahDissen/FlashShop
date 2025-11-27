const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { config } = require("../config/secret");

exports.sendEmail = async (email, subject, payload, template, attachments = []) => {
  try {
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

    if (Array.isArray(email)) {
      console.log(`Sending broadcast email to ${email.length} recipients`);
    } else {
      console.log('Sending email to:', email);
    }

    const templatePath = path.resolve(__dirname, template);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templatePath}`);
    }

    const source = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(source);

    const mailOptions = {
      from: process.env.USER,
      subject,
      html: compiledTemplate(payload),
      attachments: attachments
    };

    if (Array.isArray(email)) {
      mailOptions.bcc = email;
    } else {
      mailOptions.to = email;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info && info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('sendEmail error:', error);
    throw error;
  }
};