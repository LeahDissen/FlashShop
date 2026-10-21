const crypto = require("crypto");
const { ClubModel } = require("../models/clubModel");
const { CouponModel } = require("../models/couponModel");
const { loadShopSettings } = require("./shopSettingsController");
const { sendEmail } = require("../utils/sendEmail");
const { getClientUrl } = require("../utils/clientUrl");
const { createUnsubscribeToken, verifyUnsubscribeToken } = require("../utils/unsubscribeToken");
const { sendGiftConfirmEmail, sendJoinGiftEmail, sendWelcomeEmail } = require("../services/clubEmails");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isValidEmail = (email) => EMAIL_PATTERN.test(String(email || ""));
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
/** How many emails are sent in parallel in a mailing – Gmail does not like hundreds of connections at once */
const BROADCAST_CONCURRENCY = 5;
// Prevents two mailings in parallel (e.g. a double click or another tab)
let broadcastInProgress = false;

/** The unsubscribe link points to the API server (where the route is), based on the address the request came to */
const unsubscribeUrlFor = (req, member) =>
    `${req.protocol}://${req.get("host")}/club/unsubscribe/${member._id}/${createUnsubscribeToken(member._id)}`;

const CASE_INSENSITIVE = { locale: "en", strength: 2 };

const generateGiftCode = () => {
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `GIFT-${randomPart}`;
};

exports.joinClub = async (req, res) => {
    try {
        const { user_id, name, birthDate } = req.body;
        const email = String(req.body.email || "").trim().toLowerCase();
        if (!email || !name) {
            return res.status(400).json({ msg: "יש למלא שם וכתובת מייל" });
        }
        // A duplicate signup is rejected – no email is sent again and the existing benefit code is not revealed
        // Case-insensitive comparison – older members were saved before emails were normalized
        const existingMember = await ClubModel.findOne({ email }).collation(CASE_INSENSITIVE);
        if (existingMember) {
            return res.status(409).json({ msg: "כתובת המייל הזו כבר רשומה למועדון", code: "ALREADY_MEMBER" });
        }
        const newCode = generateGiftCode();
        const { clubGift } = await loadShopSettings();
        const giftOn = Boolean(clubGift?.enabled && clubGift.productId);
        const verifyToken = giftOn ? crypto.randomBytes(24).toString("hex") : undefined;
        const newMember = new ClubModel({
            user_id: user_id || null,
            email,
            name,
            birthDate,
            giftCode: newCode,
            // The code gives the join gift only while it is turned on (after the email is confirmed); otherwise it is just a member id
            giftType: giftOn ? "pending-gift" : "none",
            verifyToken,
            isUsed: false
        });
        await newMember.save();
        // The emails are sent in the background: the signup is already saved, and the customer does not need to wait for the mail server
        sendWelcomeEmail({ email, name, code: "" })
            .then(() => console.log("Welcome email sent to " + email))
            .catch((emailErr) => console.error("Failed to send welcome email:", emailErr.message));
        if (giftOn) {
            const confirmUrl = `${req.protocol}://${req.get("host")}/club/confirm/${verifyToken}`;
            sendGiftConfirmEmail({ email, name, confirmUrl })
                .catch((emailErr) => console.error("Failed to send gift confirmation email:", emailErr.message));
        }
        // The gift code is revealed only in the email sent after confirming the address
        res.status(201).json({ msg: "הצטרפת בהצלחה!", code: null, pendingGift: giftOn });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ msg: "כתובת המייל הזו כבר רשומה למועדון", code: "ALREADY_MEMBER" });
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
            if (member.giftType === "join-gift") {
                // Calculated at checkout on the gift product, not as a cart discount
                return res.json({ valid: true, msg: "קוד מתנת ההצטרפות התקבל! המתנה תחושב בשלב התשלום", discountType: "percent", discountValue: 0, isMemberCode: true });
            }
            if (member.giftType === "none" || member.giftType === "pending-gift") {
                return res.json({ valid: false, msg: "קוד לא נמצא" });
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

        // Whoever asked to be removed gets no marketing email, under any filter
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
            // In multipart the list arrives as a JSON string
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

        // Invalid addresses are skipped and reported to the admin instead of failing the whole send
        const skipped = members.filter((m) => !isValidEmail(m.email)).map((m) => m.email);
        const valid = members.filter((m) => isValidEmail(m.email));

        // Each recipient gets a separate email with their own unsubscribe link
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
            // If the whole first batch failed, the email service itself is unavailable — no point in continuing to wait
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

/** Manual member add from the admin – without a welcome email */
exports.addClubMember = async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const email = normalizeEmail(req.body?.email);
        const birthDate = req.body?.birthDate ? new Date(req.body.birthDate) : undefined;

        if (!name || !isValidEmail(email)) {
            return res.status(400).json({ msg: "יש להזין שם וכתובת מייל תקינה" });
        }
        // Case-insensitive: older members were saved before emails were normalized
        if (await ClubModel.exists({ email }).collation({ locale: "en", strength: 2 })) {
            return res.status(409).json({ msg: "כתובת המייל הזו כבר רשומה למועדון" });
        }

        const member = await ClubModel.create({
            name,
            email,
            birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : undefined,
            giftCode: generateGiftCode(),
            // Added by hand: no join gift
            giftType: "none",
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

/** A small response page for links opened from an email (no login) */
const responsePage = (title, text) => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f4f5f7;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="background:#fff;border:1px solid #e8eaef;border-radius:16px;padding:32px 40px;max-width:420px;text-align:center;">
<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1px;color:#f2665e;">FLASHSHOP</p>
<h1 style="margin:0 0 12px;font-size:20px;color:#1f2937;">${title}</h1>
<p style="margin:0;color:#4b5563;line-height:1.7;">${text}</p>
<p style="margin:20px 0 0;"><a href="${getClientUrl()}" style="color:#f2665e;font-weight:700;">חזרה לאתר</a></p>
</div></body></html>`;

/** The unsubscribe link from the email – a small response page, no login */
exports.unsubscribe = async (req, res) => {
    const page = responsePage;
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


/** The link from the confirmation email: the member's address is real, so her join gift code is sent */
exports.confirmGiftEmail = async (req, res) => {
    try {
        const token = String(req.params.token || "");
        if (!/^[a-f0-9]{48}$/.test(token)) {
            return res.status(400).send(responsePage("הקישור אינו תקין", "לא הצלחנו לזהות את הבקשה. אפשר לפנות אלינו דרך האתר."));
        }
        const member = await ClubModel.findOneAndUpdate(
            { verifyToken: token, giftType: "pending-gift" },
            { $set: { giftType: "join-gift" }, $unset: { verifyToken: 1 } },
            { new: true },
        );
        if (!member) {
            return res.status(400).send(responsePage("הקישור כבר שומש", "המייל כבר אושר, וקוד המתנה נשלח אלייך. אם לא מצאת אותו, כדאי לבדוק בתיקיית הספאם."));
        }
        const { clubGift } = await loadShopSettings();
        if (clubGift?.enabled && clubGift.productId) {
            sendJoinGiftEmail({ email: member.email, name: member.name, code: member.giftCode, clubGift })
                .catch((emailErr) => console.error("Failed to send join gift email:", emailErr.message));
            return res.send(responsePage("המייל אושר! 🎁", "קוד מתנת ההצטרפות נשלח אלייך עכשיו במייל."));
        }
        res.send(responsePage("המייל אושר", "תודה! כתובת המייל שלך אושרה."));
    } catch (err) {
        console.error("confirm gift email error:", err.message);
        res.status(500).send(responsePage("משהו השתבש", "נסו שוב מאוחר יותר."));
    }
};
