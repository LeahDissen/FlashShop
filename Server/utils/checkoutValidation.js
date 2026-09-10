const letterCount = (value) => (String(value || "").match(/[\u0590-\u05FFa-zA-Z]/g) || []).length;

const isSameCharRepeated = (value) => {
    const compact = String(value || "").replace(/\s+/g, "");
    return compact.length >= 2 && /^(.)\1+$/u.test(compact);
};

const normalizePhoneDigits = (phone) => {
    let digits = String(phone || "").replace(/\D/g, "");
    if (digits.startsWith("972")) {
        digits = `0${digits.slice(3)}`;
    }
    return digits;
};

const validateFullName = (name) => {
    const value = String(name || "").trim();
    if (value.length < 3) return "יש להזין שם מלא";
    const words = value.split(/\s+/).filter(Boolean);
    if (words.length < 2) return "יש להזין שם פרטי ושם משפחה";
    if (words.some((word) => letterCount(word) < 2)) {
        return "יש להזין שם מלא תקין";
    }
    return "";
};

const validateIsraeliPhone = (phone) => {
    const digits = normalizePhoneDigits(phone);
    if (/^05\d{8}$/.test(digits)) return "";
    if (/^0[2-489]\d{7}$/.test(digits)) return "";
    return "יש להזין מספר טלפון ישראלי תקין";
};

const validateEmailAddress = (email, { required = true } = {}) => {
    const value = String(email || "").trim();
    if (!value) return required ? "יש להזין כתובת מייל" : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "יש להזין כתובת מייל תקינה";
    return "";
};

const validatePlaceName = (value, label) => {
    const text = String(value || "").trim();
    if (text.length < 2) return `יש להזין ${label}`;
    if (letterCount(text) < 2) return `${label} אינו תקין`;
    if (isSameCharRepeated(text)) return `${label} אינו תקין`;
    return "";
};

const validateHouseNumber = (value) => {
    const text = String(value || "").trim();
    if (!text) return "יש להזין מספר בית";
    if (!/\d/.test(text)) return "מספר בית חייב לכלול ספרה";
    if (text.length > 12) return "מספר בית אינו תקין";
    return "";
};

exports.validateCheckoutDetails = ({ fulfillmentMethod, customer = {}, shipping = {} }) => {
    const errors = {};
    const nameError = validateFullName(customer.name);
    if (nameError) errors.name = nameError;

    const phoneError = validateIsraeliPhone(customer.phone);
    if (phoneError) errors.phone = phoneError;

    const emailError = validateEmailAddress(customer.email, {
        required: fulfillmentMethod === "pickup",
    });
    if (emailError) errors.email = emailError;

    if (fulfillmentMethod === "delivery") {
        const cityError = validatePlaceName(shipping.city, "עיר");
        if (cityError) errors.city = cityError;
        const streetError = validatePlaceName(shipping.street, "רחוב");
        if (streetError) errors.street = streetError;
        const houseError = validateHouseNumber(shipping.houseNumber);
        if (houseError) errors.houseNumber = houseError;
    }

    return errors;
};

exports.firstCheckoutValidationMessage = (errors) =>
    errors.name || errors.phone || errors.email || errors.city || errors.street || errors.houseNumber || "";
