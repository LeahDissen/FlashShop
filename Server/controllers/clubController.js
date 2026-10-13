const crypto = require("crypto");
const { ClubModel } = require("../models/clubModel");
const { CouponModel } = require("../models/couponModel");
const { sendEmail } = require("../utils/sendEmail");
const { getClientUrl } = require("../utils/clientUrl");
const { createUnsubscribeToken, verifyUnsubscribeToken } = require("../utils/unsubscribeToken");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isValidEmail = (email) => EMAIL_PATTERN.test(String(email || ""));
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
/** כמה מיילים נשלחים במקביל בדיוור – Gmail לא אוהב מאות חיבורים בבת אחת */
const BROADCAST_CONCURRENCY = 5;
// מונע שתי שליחות דיוור במקביל (למשל לחיצה כפולה או טאב נוסף)
let broadcastInProgress = false;

/** קישור ההסרה מצביע לשרת ה-API (שם הנתיב), לפי הכתובת שבה הבקשה הגיעה */
const unsubscribeUrlFor = (req, member) =>
    `${req.protocol}://${req.get("host")}/club/unsubscribe/${member._id}/${createUnsubscribeToken(member._id)}`;

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
        try {
            await sendEmail(
                email,
                "ברוכים הבאים למועדון! 🎁",
                { name: name, code: newCode },
                "./template/clubWelcome.handlebars"
            );
            console.log("Welcome email sent to " + email);
        } catch (emailErr) {
            console.error("Failed to send welcome email:", emailErr);
        }
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
            .select("name email birthDate giftCode isUsed unsubscribed createdAt")
            .sort({ createdAt: -1 });
        res.json(members);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת חברי המועדון" });
    }
};

exports.sendBroadcastEmail = async (req, res) => {
    if (broadcastInProgress) {
        return res.status(409).json({ msg: "שליחת דיוור אחרת עדיין מתבצעת. נא להמתין לסיומה." });
    }
    broadcastInProgress = true;
    try {
        const subject = req.body?.subject?.trim();
        const message = req.body?.message?.trim();
        const recipientType = (req.body?.recipientType || "all").trim();

        if (!subject || !message) {
            return res.status(400).json({ msg: "נא למלא נושא ותוכן הודעה" });
        }

        // מי שביקש/ה להסיר את עצמו/ה לא מקבל/ת דיוור שיווקי, בשום סינון
        const query = { unsubscribed: { $ne: true } };
        if (recipientType === "new_members") {
            const now = new Date();
            query.createdAt = {
                $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            };
        } else if (recipientType === "birthday") {
            query.$expr = { $eq: [{ $month: "$birthDate" }, new Date().getMonth() + 1] };
        } else if (recipientType === "selected") {
            // ב-multipart הרשימה מגיעה כמחרוזת JSON
            let memberIds = req.body?.memberIds;
            if (typeof memberIds === "string") {
                try { memberIds = JSON.parse(memberIds); } catch { memberIds = []; }
            }
            if (!Array.isArray(memberIds) || memberIds.length === 0) {
                return res.status(400).json({ msg: "לא נבחרו נמענים" });
            }
            query._id = { $in: memberIds };
        }

        const members = await ClubModel.find(query).select("name email");
        if (members.length === 0) {
            return res.status(404).json({ msg: "לא נמצאו חברי מועדון העונים על קריטריוני הסינון" });
        }

        const attachments = req.file
            ? [{ filename: req.file.originalname, content: req.file.buffer }]
            : [];

        // כתובות לא חוקיות מדולגות ומדווחות למנהלת במקום להפיל את כל השליחה
        const skipped = members.filter((m) => !isValidEmail(m.email)).map((m) => m.email);
        const valid = members.filter((m) => isValidEmail(m.email));

        // כל נמען מקבל מייל נפרד עם קישור הסרה משלו
        const failed = [];
        let sent = 0;
        for (let i = 0; i < valid.length; i += BROADCAST_CONCURRENCY) {
            const batch = valid.slice(i, i + BROADCAST_CONCURRENCY);
            const results = await Promise.allSettled(batch.map((member) => sendEmail(
                member.email,
                subject,
                { title: subject, message, unsubscribeUrl: unsubscribeUrlFor(req, member) },
                "./template/generalMail.handlebars",
                attachments,
            )));
            results.forEach((result, idx) => {
                if (result.status === "fulfilled") sent += 1;
                else failed.push(batch[idx].email);
            });
            // אם כל הקבוצה הראשונה נכשלה, שירות המייל עצמו לא זמין — אין טעם להמשיך ולהמתין
            if (sent === 0 && failed.length === batch.length && i === 0) {
                return res.status(503).json({
                    msg: "שירות המייל לא זמין כרגע ולכן ההודעה לא נשלחה לאף אחד. נא לנסות שוב מאוחר יותר.",
                    sent: 0,
                    failed: valid.map((m) => m.email),
                    skipped,
                });
            }
        }

        res.json({
            msg: sent > 0 ? `המייל נשלח ל-${sent} חברי מועדון` : "המייל לא נשלח לאף נמען",
            sent,
            failed,
            skipped,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשליחת המיילים" });
    } finally {
        broadcastInProgress = false;
    }
};

/** הוספה ידנית של חבר/ה מהאדמין – בלי מייל ברוכים הבאים */
exports.addClubMember = async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const email = normalizeEmail(req.body?.email);
        const birthDate = req.body?.birthDate ? new Date(req.body.birthDate) : undefined;

        if (!name || !isValidEmail(email)) {
            return res.status(400).json({ msg: "יש להזין שם וכתובת מייל תקינה" });
        }
        if (await ClubModel.exists({ email })) {
            return res.status(409).json({ msg: "כתובת המייל הזו כבר רשומה למועדון" });
        }

        const member = await ClubModel.create({
            name,
            email,
            birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : undefined,
            giftCode: generateGiftCode(),
            isUsed: false,
        });
        res.status(201).json(member);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בהוספת חבר/ת מועדון" });
    }
};

exports.deleteClubMember = async (req, res) => {
    try {
        const deleted = await ClubModel.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ msg: "חבר/ת המועדון לא נמצא/ה" });
        }
        res.json({ msg: "הוסר/ה מהמועדון" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בהסרת חבר/ת מועדון" });
    }
};

/** קישור ההסרה מהמייל – דף תשובה קטן, בלי התחברות */
exports.unsubscribe = async (req, res) => {
    const page = (title, text) => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f4f5f7;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="background:#fff;border:1px solid #e8eaef;border-radius:16px;padding:32px 40px;max-width:420px;text-align:center;">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1px;color:#f2665e;">FLASHSHOP</p>
<h1 style="margin:0 0 12px;font-size:20px;color:#1f2937;">${title}</h1>
<p style="margin:0;color:#4b5563;line-height:1.7;">${text}</p>
<p style="margin:20px 0 0;"><a href="${getClientUrl()}" style="color:#f2665e;font-weight:700;">חזרה לאתר</a></p>
</div></body></html>`;

    try {
        const { id, token } = req.params;
        if (!verifyUnsubscribeToken(id, token)) {
            return res.status(400).send(page("הקישור אינו תקין", "לא הצלחנו לזהות את הבקשה. אפשר לפנות אלינו דרך האתר."));
        }
        await ClubModel.findByIdAndUpdate(id, { unsubscribed: true });
        res.send(page("הוסרת מרשימת התפוצה", "לא נשלח לך עוד דיוור שיווקי. קוד ההטבה שלך נשאר בתוקף."));
    } catch (err) {
        console.log(err);
        res.status(500).send(page("משהו השתבש", "נסו שוב מאוחר יותר."));
    }
};
