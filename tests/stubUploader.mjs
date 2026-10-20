export const calls = [];
let inFlight = 0, maxInFlight = 0;
export const stats = () => ({ maxInFlight });
export async function uploadImageDetailed(file) {
    calls.push(file.name); inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 20));
    inFlight--;
    if (file.name === "flaky.jpg" && calls.filter((n) => n === "flaky.jpg").length < 3) throw Object.assign(new Error("net"), { retryable: true });
    if (file.name === "broken.jpg") throw Object.assign(new Error("bad file"), { retryable: false });
    return { url: `https://cdn/${file.name}`, width: 100, height: 50 };
}
