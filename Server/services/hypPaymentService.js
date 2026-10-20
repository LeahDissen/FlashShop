const axios = require("axios");
const { config } = require("../config/secret");

/** Hyp Pay's payment page and API (https://developers.hyp.co.il/pay) */
const HYP_URL = "https://pay.hyp.co.il/p/";
const REQUEST_TIMEOUT_MS = 15_000;
/** What the payment page shows when the signature does not match the terminal (usually a wrong or truncated KEY) */
const PAYMENT_PAGE_AUTH_ERROR = "שגיאת אימות";

exports.isHypConfigured = () => Boolean(config.HYP_MASOF && config.HYP_KEY && config.HYP_PASSP);

const credentials = () => ({ KEY: config.HYP_KEY, PassP: config.HYP_PASSP, Masof: config.HYP_MASOF });

const toQuery = (params) => Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

// Hyp ends its answers with a newline ("CCode=0\n"), so the text is trimmed before reading the code
const readCode = (responseText) => new URLSearchParams(String(responseText).trim()).get("CCode");

const splitName = (fullName = "") => {
    const [first, ...rest] = String(fullName).trim().split(/\s+/);
    return { first: first || "", last: rest.join(" ") };
};

/**
 * Requests a signed link to the order's payment page from Hyp.
 * @returns {Promise<string>} the URL the customer is redirected to
 */
exports.createPaymentUrl = async (order) => {
    const { first, last } = splitName(order.customer?.name);
    const query = toQuery({
        action: "APISign",
        What: "SIGN",
        Sign: "True",
        ...credentials(),
        Amount: Number(order.total_price).toFixed(2),
        Order: String(order._id),
        Info: `הזמנה ${String(order._id).slice(-8).toUpperCase()}`,
        ClientName: first,
        ClientLName: last,
        email: order.customer?.email,
        cell: String(order.customer?.phone || "").replace(/\D/g, ""),
        PageLang: "HEB",
        // Values are sent as UTF-8; without this the payment page (windows-1255) shows Hebrew as gibberish
        UTF8: "True",
        UTF8out: "True",
    });

    const { data } = await axios.get(`${HYP_URL}?${query}`, { timeout: REQUEST_TIMEOUT_MS, responseType: "text" });
    const response = String(data).trim();
    if (!/(^|&)signature=/.test(response)) {
        throw new Error(`Hyp SIGN failed (CCode=${readCode(response) ?? "?"})`);
    }
    // The response is appended as is, in the same order, to the payment page URL
    return `${HYP_URL}?${response}`;
};

/**
 * Verifies with Hyp that the return to the success page is genuine and not forged.
 * @param {string} redirectQuery the query string that reached the success page, as is and in the same order
 * @returns {Promise<boolean>}
 */
exports.verifyPaymentRedirect = async (redirectQuery) => {
    const params = String(redirectQuery || "").replace(/^\?/, "");
    const query = `${toQuery({ action: "APISign", What: "VERIFY", ...credentials() })}&${params}`;
    const { data } = await axios.get(`${HYP_URL}?${query}`, { timeout: REQUEST_TIMEOUT_MS, responseType: "text" });
    return readCode(data) === "0";
};

/**
 * Connection check without charging: signs a 1 ILS page and opens it the way a customer would.
 * A wrong KEY still gets a signature back, and only the payment page itself rejects it, so both steps are checked.
 * @returns {Promise<{ ok: boolean, code: string | null, reason?: string }>}
 */
exports.checkConnection = async () => {
    const query = toQuery({ action: "APISign", What: "SIGN", Sign: "True", ...credentials(), Amount: "1.00", Order: "connection-check" });
    const { data } = await axios.get(`${HYP_URL}?${query}`, { timeout: REQUEST_TIMEOUT_MS, responseType: "text" });
    const response = String(data).trim();
    const code = readCode(response);
    if (!/(^|&)signature=/.test(response)) return { ok: false, code, reason: "sign" };

    const page = await axios.get(`${HYP_URL}?${response}`, { timeout: REQUEST_TIMEOUT_MS, responseType: "arraybuffer" });
    const html = Buffer.from(page.data);
    const pageRejected = [html.toString("utf8"), new TextDecoder("windows-1255").decode(html)]
        .some((text) => text.includes(PAYMENT_PAGE_AUTH_ERROR));
    return pageRejected ? { ok: false, code, reason: "page" } : { ok: true, code };
};
