const crypto = require("crypto");
const { ClubModel } = require("../models/clubModel");
const { CouponModel } = require("../models/couponModel");
const { sendEmail } = require("../utils/sendEmail");
const axios = require("axios");
const { PageModel } = require("../models/pageModel");

const DEFAULT_WELCOME_SUBJECT = "ברוכים הבאים למועדון! 🎁";

/** {{name}} / {{code}} בנוסח שהמנהלת כותבת; מפתח לא מוכר נשאר גלוי */
const renderWelcomeText = (text, vars) =>
    String(text || "").replace(/{{\s*(\w+)\s*}}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
    );

/** מוריד את קובץ המתנה (PDF) כדי לצרף אותו למייל; כשל לא מונע את המייל עצמו */
const fetchWelcomeAttachment = async (url) => {
    if (!url) return [];
    try {
        const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000, maxContentLength: 15 * 1024 * 1024 });
        const nameFromUrl = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
        const filename = /\.pdf$/i.test(nameFromUrl) ? nameFromUrl : "gift.pdf";
        return [{ filename, content: Buffer.from(response.data), contentType: "application/pdf" }];
    } catch (err) {
        console.error("[Club] welcome attachment download failed:", err.message);
        return [];
    }
};

/** שולח את מייל ההצטרפות לפי ההגדרות בדף 'club' (נושא, גוף, קובץ מצורף) */
const sendWelcomeEmail = async ({ email, name, code }) => {
    const page = await PageModel.findOne({ key: "club" }).lean();
    const settings = page?.data || {};
    const vars = { name, code };
    const subject = renderWelcomeText(settings.welcomeSubject || DEFAULT_WELCOME_SUBJECT, vars);
    const attachments = await fetchWelcomeAttachment(settings.welcomeAttachmentUrl);

    if (settings.welcomeBody) {
        return sendEmail(
            email,
            subject,
            { title: subject, message: renderWelcomeText(settings.welcomeBody, vars) },
            "./template/generalMail.handlebars",
            attachments,
        );
    }
    return sendEmail(email, subject, vars, "./template/clubWelcome.handlebars", attachments);
};

const generateGiftCode = () => {
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `GIFT-${randomPart}`;
};

exports.joinClub = async (req, res) => {
    try {
        const { user_id, email, name, birthDate } = req.body;
        const existingMember = await ClubModel.findOne({ email });
        if (existingMember) {
            return res.status(200).json({
                msg: "המייל הזה כבר רשום למועדון",
                code: existingMember.giftCode
            });
        }
        const newCode = generateGiftCode();
        const newMember = new ClubModel({
            user_id: user_id || null,
            email,
            name,
            birthDate,
            giftCode: newCode,
            isUsed: false
        });
        await newMember.save();
        // המייל נשלח ברקע: ההרשמה כבר נשמרה, והלקוחה לא צריכה לחכות לשרת המייל
        sendWelcomeEmail({ email, name, code: newCode })
            .then(() => console.log("Welcome email sent to " + email))
            .catch((emailErr) => console.error("Failed to send welcome email:", emailErr.message));
        res.status(201).json({ msg: "הצטרפת בהצלחה!", code: newCode });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: "אתה כבר חבר מועדון" });
        }
        res.status(500).json({ msg: "שגיאה בהצטרפות" });
    }
};

exports.checkGiftCode = async (req, res) => {
    try {
        const { code } = req.params;
        const { userId } = req.query;
        const generalCoupon = await CouponModel.findOne({ code: code });
        
        if (generalCoupon) {
            if (!generalCoupon.isActive) {
                return res.json({ valid: false, msg: "הקופון אינו פעיל" });
            }
            if (generalCoupon.expirationDate && new Date() > new Date(generalCoupon.expirationDate)) {
                return res.json({ valid: false, msg: "תוקף הקופון פג" });
            }
            if (userId && generalCoupon.usedBy.includes(userId)) {
                return res.json({ valid: false, msg: "כבר השתמשת בקופון זה בעבר" });
            }
            
            return res.json({ 
                valid: true, 
                msg: "קופון התקבל!", 
                discountType: generalCoupon.type,
                discountValue: generalCoupon.value 
            });
        }

        const member = await ClubModel.findOne({ giftCode: code });
        if (member) {
            if (member.isUsed) {
                return res.json({ valid: false, msg: "הקוד הזה כבר נוצל בעבר" });
            }
            return res.json({ 
                valid: true, 
                msg: "קוד חבר מועדון התקבל! קיבלת 15% הנחה", 
                discountType: 'percent', 
                discountValue: 15,
                isMemberCode: true 
            });
        }

        return res.json({ valid: false, msg: "קוד לא נמצא" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בבדיקת הקוד" });
    }
};

exports.redeemGift = async (req, res) => {
    try {
        const { user_id } = req.body;
        const updatedMember = await ClubModel.findOneAndUpdate(
            { user_id, isUsed: false },
            { isUsed: true },
            { new: true }
        );
        if (!updatedMember) {
            return res.status(400).json({ msg: "לא נמצא קופון פעיל למשתמש זה" });
        }
        res.json({ msg: "המתנה נוצלה בהצלחה!", data: updatedMember });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה במימוש המתנה" });
    }
};

exports.getClubMembers = async (req, res) => {
    try {
        const members = await ClubModel.find({})
            .select("name email birthDate giftCode isUsed createdAt")
            .sort({ createdAt: -1 });
        res.json(members);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת חברי המועדון" });
    }
};

exports.sendBroadcastEmail = async (req, res) => {
    try {
        const subject = req.body?.subject?.trim();
        const message = req.body?.message?.trim();
        const recipientType = (req.body?.recipientType || 'all').trim();

        if (!subject || !message) {
            return res.status(400).json({ msg: "נא למלא נושא ותוכן הודעה" });
        }

        let query = {};
        if (recipientType === 'new_members') {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            query = {
                createdAt: {
                    $gte: startOfMonth,
                    $lt: startOfNextMonth,
                },
            };
        } else if (recipientType === 'birthday') {
            const currentMonth = new Date().getMonth() + 1;
            query = {
                $expr: {
                    $eq: [{ $month: "$birthDate" }, currentMonth],
                },
            };
        }

        const members = await ClubModel.find(query);
        const emails = members.map(m => m.email);

        if (emails.length === 0) {
            return res.status(404).json({ msg: "לא נמצאו חברי מועדון העונים על קריטריוני הסינון" });
        }
        let attachments = [];
        if (req.file) {
            attachments.push({
                filename: req.file.originalname,
                content: req.file.buffer,
            });
        }
        await sendEmail(
            emails,
            subject,
            { title: subject, message },
            "./template/generalMail.handlebars",
            attachments,
        );
        res.json({ msg: `המייל נשלח בהצלחה ל-${members.length} חברי מועדון!` });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשליחת המיילים" });
    }
};