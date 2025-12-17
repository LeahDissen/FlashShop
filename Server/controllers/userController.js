const { auth, authAdmin } = require("../middlewares/auth");
const bcrypt = require("bcrypt");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { UserModel, createToken, validateUser, validateLogin } = require("../models/userModel");
const { Token } = require("../models/tokenModel");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");
const { config } = require("../config/secret");
const clientURL = "http://localhost:3001";
//change to async func needed
//'/signup'
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
//'/login'
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
    let token = createToken(user._id,user.role);
    res.json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};
//'/forgot-password'
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
    const { userId, token, password } = req.body;

    if (!userId || !token || !password) {
      return res.status(400).json({ msg: "Missing required fields" });
    }


    let passwordResetToken = await Token.findOne({ userId: userId });

    if (!passwordResetToken) {
      return res.status(400).json({ msg: "Invalid or expired password reset token" });
    }

    const isValid = await bcrypt.compare(token, passwordResetToken.token);
    if (!isValid) {
      return res.status(400).json({ msg: "Invalid or expired password reset token" });
    }

  
    const hash = await bcrypt.hash(password, 10);

   
    await UserModel.updateOne(
      { _id: userId },
      { $set: { password: hash } }
    );

    const user = await UserModel.findById(userId);

   
    await sendEmail(
      user.email,
      "Password Reset Successful",
      {
        name: user.name,
        loginLink: `${clientURL}/login`
      },
      "./utils/template/passwordReset.handlebars" 
    );

    await Token.deleteOne({ _id: passwordResetToken._id });

    return res.json({ success: true, msg: "Password reset was successful" });

  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ msg: "There was an error, try again later", err: err.message });
  }
};

//'/myEmail'
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
//'/myInfo'
exports.myInfo = async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};
// //'/usersLIst'
// router.get("/usersLIst", authAdmin, async (req, res) => {
//     try {
//         let users = await UserModel.find({}, { password: 0 });
//         res.json(users);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ msg: "There was an error, try again later", err });
//     }
// });




