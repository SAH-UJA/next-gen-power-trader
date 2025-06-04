export function buildContext(chat = []) {
    return chat
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-5)
        .map(msg => ({ role: msg.role, content: msg.content }));
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
        return data.answer || apiReply;
    } catch (e) {
        return apiReply + "\n(Humanizer unavailable)";
    }
}

export async function handleToolCall(toolConfig, prevMessage, newChatArr) {
    if (!toolConfig || !toolConfig.function) throw new Error("No tool config found.");

    // Intercept trade submission and ask for confirmation
    if (toolConfig.function === "submit_trade") {
        const confirmMsg = "Please confirm the trade details below before submission.";
        // Find the chat index where this message will be added (after tool call)
        const chatIdx = newChatArr.length; // will become the index of the next assistant message
        setPendingTrade({
            params: toolConfig.params,
            userQuestion: prevMessage,
            chatIdx
        });
        return confirmMsg;
    }

    let result = null;
    let apiReply = "";
    try {
        if (toolConfig.function === "get_order_details") {
            const { orderId } = toolConfig.params || {};
            if (!orderId) throw new Error("orderId missing in params");
            const res = await fetch(`https://next-gen-power-trader-app-latest.onrender.com/trade/status/${orderId}`);
            result = await res.json();
            apiReply = "Order Details:\n" + JSON.stringify(result, null, 2);
        } else if (toolConfig.function === "get_account_info") {
            const res = await fetch("https://next-gen-power-trader-app-latest.onrender.com/trade/accountInfo");
            result = await res.json();
            apiReply = "Account Info:\n" + JSON.stringify(result, null, 2);
        } else if (toolConfig.function === "get_trade_status") {
            const params = toolConfig.params || {};
            const orderId = params.orderId || params.order_id;
            if (!orderId) throw new Error("orderId missing in params for get_trade_status");
            const res = await fetch(`https://next-gen-power-trader-app-latest.onrender.com/trade/status/${orderId}`);
            result = await res.json();
            apiReply = "Trade Status:\n" + JSON.stringify(result, null, 2);
        } else {
            console.error("Unknown tool function:", toolConfig.function);
            throw new Error("Unknown tool function requested.");
        }
        const humanized = await humanizeStructuredReply(prevMessage, apiReply);
        return humanized;
    } catch (e) {
        throw new Error("Error in tool API: " + (e.message || e));
    }
}