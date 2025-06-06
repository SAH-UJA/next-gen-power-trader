export function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export async function humanizeStructuredReply(prevMessage, apiReply) {
    try {
        const rawConcat = prevMessage + '\n' + apiReply;
        const res = await fetch("http://localhost:8000/ask/humanizer/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw: rawConcat }),
        });

        if (!res.body || !window.ReadableStream) {
            // Fallback to old method if streaming not supported
            const data = await res.json();
            if (data.answer) {
                return data.answer;
            }
            return apiReply;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
        }
        return result.trim() || apiReply;
    } catch (e) {
        return apiReply + "\n(Humanizer unavailable)";
    }
}
