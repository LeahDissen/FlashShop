const { ClubModel } = require("../models/clubModel");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");

const generateGiftCode = () => {
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `GIFT-${randomPart}`;
};

exports.joinClub = async (req, res) => {
    try {
        const { user_id, email, name, birthDate } = req.body;
        const existingMember = await ClubModel.findOne({ user_id });
        if (existingMember) {
            console.log("i'm here?");
            return res.status(200).json({
                msg: "אתה כבר חבר מועדון",
                code: existingMember.giftCode
            });
        }
        const newCode = generateGiftCode();
        const newMember = new ClubModel({
            user_id,
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
        res.status(500).json({ msg: "שגיאה בהצטרפות", err });
    }
};

exports.checkGiftCode = async (req, res) => {
    try {
        const { code } = req.params;
        const member = await ClubModel.findOne({ giftCode: code });
        if (!member) {
            return res.json({ msg: "קוד לא נמצא", valid: false });
        }
        if (member.isUsed) {
            return res.json({ msg: "הקוד הזה כבר נוצל בעבר", valid: false });
        }
        res.json({ msg: "קוד תקין! מגיע לך מתנה", valid: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בבדיקת הקוד", err });
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
        res.status(500).json({ msg: "שגיאה במימוש המתנה", err });
    }
};

exports.sendBroadcastEmail = async (req, res) => {
    try {
        const { subject, message, recipientType } = req.body;
        let query = {};
        const now = new Date();
        if (recipientType === 'new_members') {
            const lastMonth = new Date(now.setDate(now.getDate() - 30));
            query = { createdAt: { $gte: lastMonth } };
        }
        // } else if (recipientType === 'birthday') {
        //     // יום הולדת החודש (דורש מונגו 5+ לאגרגציה פשוטה, כאן נשתמש בסינון JS אם המסד קטן או שאילתה מתקדמת)
        //     // לצורך הפשטות נשלח לכולם אם אין לוגיקה מורכבת, או נשאיר ריק לכולם
        // }
        const members = await ClubModel.find(query);
        const emails = members.map(m => m.email);

        if (emails.length === 0) {
            return res.status(404).json({ msg: "לא נמצאו חברי מועדון מתאימים לשליחה" });
        }
        let attachments = [];
        if (req.file) {
            attachments.push({
                filename: req.file.originalname,
                content: req.file.buffer
            });
        }
        await sendEmail(
            process.env.USER,
            subject,
            { title: subject, message: message },
            "./template/generalMail.handlebars",
            attachments,
            // נצטרך לשנות מעט את sendEmail כדי לתמוך ב-bcc או לשלוח בלולאה.
            // לטובת הפשטות: נשלח ב-BCC אחד גדול (הכי יעיל לרשימות קטנות/בינוניות)
        );

        // *הערה*: הפונקציה sendEmail המקורית שולחת ל-to. 
        // כדי לשלוח לרשימת תפוצה, מומלץ לעדכן את ה-mailOptions ב-sendEmail להשתמש ב-bcc: emails
        // או לשלוח בלולאה (פחות מומלץ לכמות גדולה).

        // פתרון מהיר כאן: קריאה ל-sendEmail עבור כל משתמש (לא אופטימלי אך עובד)
        // או עדיף: עדכון sendEmail שיתמוך ב-bcc. נניח כרגע שזה שולח אחד אחד או שהתאמת את sendEmail.

        // שליחה בלולאה (פשוט למימוש כרגע):
        for (let email of emails) {
            sendEmail(email, subject, { title: subject, message }, "./template/generalMail.handlebars", attachments).catch(e => console.error(e));
        }
        res.json({ msg: `המייל נשלח בהצלחה ל-${members.length} חברי מועדון!` });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשליחת המיילים", err });
    }
};