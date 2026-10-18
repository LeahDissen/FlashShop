const axios = require("axios");
const { config } = require("../config/secret");

/** Hyp Pay's payment page and API (https://developers.hyp.co.il/pay) */
const HYP_URL = "https://pay.hyp.co.il/p/";
const REQUEST_TIMEOUT_MS = 15_000;

exports.isHypConfigured = () => Boolean(config.HYP_MASOF && config.HYP_KEY && config.HYP_PASSP);

const credentials = () => ({ KEY: config.HYP_KEY, PassP: config.HYP_PASSP, Masof: config.HYP_MASOF });

const toQuery = (params) => Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

const readCode = (responseText) => new URLSearchParams(String(responseText)).get("CCode");

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
 * Connection check without charging: requests a signature for 1 ₪ and does not send any customer to payment.
 * @returns {Promise<{ ok: boolean, code: string | null }>}
 */
exports.checkConnection = async () => {
    const query = toQuery({ action: "APISign", What: "SIGN", Sign: "True", ...credentials(), Amount: "1.00", Order: "connection-check" });
    const { data } = await axios.get(`${HYP_URL}?${query}`, { timeout: REQUEST_TIMEOUT_MS, responseType: "text" });
    const response = String(data);
    return { ok: /(^|&)signature=/.test(response), code: readCode(response) };
};
