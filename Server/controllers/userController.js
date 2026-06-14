const axios = require("axios");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { config } = require("../config/secret");
const { Token } = require("../models/tokenModel");
const { UserModel, createToken, validateUser, validateLogin } = require("../models/userModel");
const { sendEmail, hasEmailCredentials } = require("../utils/sendEmail");
const clientURL = process.env.CLIENT_URL || "http://localhost:5173";

const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

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
    setAuthCookie(res, token);
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

exports.requestPasswordReset = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    if (!email) {
      return res.status(400).json({ msg: "יש להזין כתובת מייל" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(200).json({
        msg: "אם המייל רשום במערכת, נשלח אליך קישור לאיפוס סיסמה",
      });
    }

    await Token.findOneAndDelete({ userId: user._id });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, Number(config.BCRYPT_SALT));

    await new Token({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();

    const link = `${clientURL}/reset-password?token=${resetToken}&id=${user._id}`;

    const emailResult = await sendEmail(
      user.email,
      "איפוס סיסמה - FlashShop",
      { name: user.name, link },
      "./template/requestResetPassword.handlebars"
    );

    res.status(200).json({
      msg: hasEmailCredentials()
        ? "נשלח מייל עם קישור לאיפוס הסיסמה. בדקי את תיבת המייל."
        : "המייל נשלח (מצב פיתוח). לחצי על הקישור לצפייה במייל.",
      previewUrl: emailResult.previewUrl || undefined,
    });
  } catch (error) {
    console.log(error);
    if (error.message === "EMAIL_NOT_CONFIGURED") {
      return res.status(503).json({
        msg: "שירות המייל לא מוגדר בשרת. פני למנהל המערכת.",
        code: "EMAIL_NOT_CONFIGURED",
      });
    }
    res.status(500).json({
      msg: "שגיאה בשליחת המייל. נסי שוב מאוחר יותר.",
      code: "EMAIL_SEND_FAILED",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { userId, token, password } = req.body;
    if (!userId || !token || !password) {
      return res.status(400).json({ msg: "חסרים פרטים לאיפוס הסיסמה" });
    }

    const passwordResetToken = await Token.findOne({ userId });
    if (!passwordResetToken?.token) {
      return res.status(400).json({ msg: "קישור האיפוס לא תקין או שפג תוקפו" });
    }

    const isValid = await bcrypt.compare(token, passwordResetToken.token);
    if (!isValid) {
      return res.status(400).json({ msg: "קישור האיפוס לא תקין או שפג תוקפו" });
    }

    const hash = await bcrypt.hash(password, Number(config.BCRYPT_SALT));
    await UserModel.updateOne({ _id: userId }, { $set: { password: hash } });

    const user = await UserModel.findById(userId);
    if (user && hasEmailCredentials()) {
      await sendEmail(
        user.email,
        "הסיסמה עודכנה בהצלחה - FlashShop",
        { name: user.name },
        "./template/passwordReset.handlebars"
      );
    }

    await passwordResetToken.deleteOne();
    res.status(200).json({ msg: "הסיסמה עודכנה בהצלחה" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "שגיאה בעדכון הסיסמה", error: error.message });
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

    if (!user) {
      user = new UserModel({
        name: name,
        email: email,
        role: "user"
      });
      await user.save();
    }

    const token = createToken(user._id, user.role);
    setAuthCookie(res, token);
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    res.json({ msg: "Login successful", user: userWithoutPassword });

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

