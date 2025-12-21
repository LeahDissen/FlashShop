const crypto = require("crypto");
const { ClubModel } = require("../models/clubModel");
const { CouponModel } = require("../models/couponModel");
const { sendEmail } = require("../utils/sendEmail");

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
        res.status(500).json({ msg: "שגיאה בהצטרפות", err });
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
        if (recipientType === 'new_members') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
            query = { createdAt: { $gte: oneMonthAgo } };
        }
        else if (recipientType === 'birthday') {
            const currentMonth = new Date().getMonth() + 1;
            query = {
                $expr: {
                    $eq: [{ $month: "$birthDate" }, currentMonth]
                }
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
                content: req.file.buffer
            });
        }
        await sendEmail(
            emails,
            subject,
            { title: subject, message: message },
            "./template/generalMail.handlebars",
            attachments
        );
        res.json({ msg: `המייל נשלח בהצלחה ל-${members.length} חברי מועדון!` });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשליחת המיילים", err });
    }
};