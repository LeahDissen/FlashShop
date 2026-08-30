export const CAPTION_CATEGORIES = ["כללי", "משפחה", "אהבה", "יום הולדת", "מצחיק", "מתנות"];

/** מפרק עמודת אקסל: "משפט|קטגוריה;משפט2" */
export function parseCaptionsFromCell(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return [];

    return raw
        .split(";")
        .map((part) => {
            const trimmed = part.trim();
            if (!trimmed) return null;
            const pipeIdx = trimmed.indexOf("|");
            if (pipeIdx > -1) {
                return {
                    text: trimmed.slice(0, pipeIdx).trim(),
                    category: trimmed.slice(pipeIdx + 1).trim() || "כללי",
                };
            }
            return { text: trimmed, category: "כללי" };
        })
        .filter((c) => c?.text);
}
