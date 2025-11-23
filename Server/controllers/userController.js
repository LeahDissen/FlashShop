const { auth, authAdmin } = require("../middlewares/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel, createToken, validateUser, validateLogin } = require("../models/userModel");
const { Token } = require("../models/tokenModel");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");
const { config } = require("../config/secret");
const clientURL = "http://localhost:3001";

exports.signup = async (req, res, next) => {
  try {
    let validateBody = validateUser(req.body);
    if (validateBody.error) {
      console.log(validateBody.error.details);
      return res.status(400).json(validateBody.error.details);
    }
    let user = new UserModel(req.body);
    console.log(user);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "******"
    res.status(201).json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res.status(500).json({ msg: "Email already in system, try to log in", code: 11000 })
    }
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.login = async (req, res, next) => {
  let validBody = validateLogin(req.body);
  if (validBody.error) {
    console.log(validBody.error.details);
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(401).json({ msg: "User or password not match" });
    }
    let passOk = await bcrypt.compare(req.body.password, user.password);
    if (!passOk) {
      return res.status(401).json({ msg: "User or password not match" });
    }
    let token = createToken(user._id, user.role);
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'Lax'
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
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'Lax'
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

exports.resetPassword = async (user_Id, token, password) => {
  console.log(user_Id);
  let passwordResetToken = await findOne(Token, { userId: user_Id });
  console.log("passwordResetToken" + passwordResetToken);
  console.log("yoken" + token);
  if (!passwordResetToken.token) {
    throw new Error("Invalid or expired password reset token");
  }
  console.log(passwordResetToken.token, token);
  const isValid = await bcrypt.compare(token, passwordResetToken.token);
  if (!isValid) {
    throw new Error("Invalid or expired password reset token");
  }
  const hash = await bcrypt.hash(password, Number(bcryptSalt));
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
  return { success: "Password reset was successful" };
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

exports.myInfo = async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

// router.get("/usersLIst", authAdmin, async (req, res) => {
//     try {
//         let users = await UserModel.find({}, { password: 0 });
//         res.json(users);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ msg: "There was an error, try again later", err });
//     }
// });
