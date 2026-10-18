/**
 * CLIENT_URL holds a comma-separated list of origins allowed by CORS.
 * Links sent by email (password reset, unsubscribe) use the first one in the list.
 */
exports.getClientUrl = () => {
    const first = String(process.env.CLIENT_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .find(Boolean);
    return (first || "http://localhost:5173").replace(/\/$/, "");
};
