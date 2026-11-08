/**
 * Birth date typed as digits only: "15031990" shows as "15/03/1990". The slashes are added
 * (and removed on backspace) by the formatting, so the customer never types them.
 */
export const formatBirthDateInput = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
    return parts.join('/');
};

/**
 * "DD/MM/YYYY" → "YYYY-MM-DD" for the server, or null when the date doesn't exist
 * (31/02), is in the future or is before 1900.
 */
export const parseBirthDate = (value, today = new Date()) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || ''));
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const day = Number(dd), month = Number(mm), year = Number(yyyy);
    const date = new Date(Date.UTC(year, month - 1, day));
    const exists = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    if (!exists || year < 1900 || date > today) return null;
    return `${yyyy}-${mm}-${dd}`;
};
