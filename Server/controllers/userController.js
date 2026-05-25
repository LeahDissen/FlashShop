const axios = require("axios");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { config } = require("../config/secret");
const { Token } = require("../models/tokenModel");
const { UserModel, createToken, validateUser, validateLogin } = require("../models/userModel");
const { sendEmail } = require("../utils/sendEmail");
const clientURL = process.env.CLIENT_URL;

exports.signup = async (req, res, next) => {
  try {
    let validateBody = validateUser(req.body);
    if (validateBody.error) {
      console.log(validateBody.error.details);
      const message = validateBody.error.details.map((d) => d.message).join(', ');
      return res.status(400).json({ msg: message, details: validateBody.error.details });
    }
    let user = new UserModel(req.body);
    console.log(user);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "******"
    res.status(201).json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res.status(409).json({ msg: "כתובת האימייל כבר רשומה במערכת. נסי להתחבר.", code: 11000 });
    }
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.login = async (req, res, next) => {
  let validBody = validateLogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(401).json({ msg: "User or password not match" });
    }

    if (!user.password) {
      return res.status(401).json({
        msg: "User not found with password. Did you sign up with Google?"
      });
    }

    let passOk = await bcrypt.compare(req.body.password, user.password);
    if (!passOk) {
      return res.status(401).json({ msg: "User or password not match" });
    }

    let token = createToken(user._id, user.role);
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    res.json({
      msg: "Login successful",
      user: userWithoutPassword
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
  });
  res.json({ msg: "Logout successful" });
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) throw new Error("Email does not exist");

    await Token.findOneAndDelete({ userId: user._id });

    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, Number(config.BCRYPT_SALT));

    await new Token({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();

    const link = `${clientURL}/Auth/passwordReset?token=${resetToken}&id=${user._id}`;
    console.log(link)
    await sendEmail(
      user.email,
      "Password Reset Request",
      {
        name: user.name,
        link: link,
      },
      "./template/requestResetPassword.handlebars"
    );
    console.log("email sent")
    res.status(200).json({ msg: "Password reset email sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error sending password reset email", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    console.log(req.params.id);
    let passwordResetToken = await Token.findOne({ userId: req.params.id });

    if (!passwordResetToken.token) {
      throw new Error("Invalid or expired password reset token");
    }
    console.log(passwordResetToken.token, req.body.token);
    const isValid = await bcrypt.compare(req.body.token, passwordResetToken.token);
    if (!isValid) {
      throw new Error("Invalid or expired password reset token");
    }
    const hash = await bcrypt.hash(req.body.password, Number(config.BCRYPT_SALT));

    await UserModel.updateOne(
      { _id: user_Id },
      { $set: { password: hash } },
      { new: true }
    );
    const user = await UserModel.findById(user_Id);
    sendEmail(
      user.email,
      "Password Reset Successfully",
      {
        name: user.name,
      },
      "./template/resetPassword.handlebars"
    );
    await passwordResetToken.deleteOne();
    res.status(200).json({ msg: "Password reset was successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error resetting password", error: error.message });
  }
};

exports.myEmail = async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { email: 1 });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;

    const googleResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { email, name, sub: googleId } = googleResponse.data;

    let user = await UserModel.findOne({ email: email });

    if (user) {
      const token = createToken(user._id, user.role);
      return res.json({ token, user });
    }
    user = new UserModel({
      name: name,
      email: email,
      role: "user"
    });

    await user.save();

    const token = createToken(user._id, user.role);
    res.json({ token, user });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(401).json({ msg: "Google authentication failed", err });
  }
};

exports.myInfo = async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

