export function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function humanizeStructuredReply(prevMessage, apiReply) {
    try {
        const rawConcat = prevMessage + '\n' + apiReply;
        const res = await fetch("https://next-gen-power-trader-app-latest.onrender.com/ask/humanizer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw: rawConcat }),
        });
        const data = await res.json();
        if (data.answer) {
            return data.answer;
        }
        return apiReply;
    } catch (e) {
        return apiReply + "\n(Humanizer unavailable)";
    }
}