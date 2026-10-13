/**
 * CLIENT_URL מכיל רשימת origins מורשים (מופרדים בפסיק) ל-CORS.
 * לקישורים שנשלחים במייל (איפוס סיסמה, הסרה מתפוצה) משתמשים בראשון ברשימה.
 */
exports.getClientUrl = () => {
    const first = String(process.env.CLIENT_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .find(Boolean);
    return (first || "http://localhost:5173").replace(/\/$/, "");
};
