import { useState, useRef, useEffect, useCallback } from 'react';

// Helper: Stream text to UI character by character with delay
const streamTextToUI = async (text, initialContent, setStreamingContentFn) => {
    let localContent = initialContent;
    for (let i = 0; i < text.length; i++) {
        localContent += text[i];
        setStreamingContentFn(localContent);
        await new Promise(res => setTimeout(res, 12));
    }
    return localContent;
};

export default function useChat() {
    const [question, setQuestion] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pendingTrade, setPendingTrade] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState(""); // Buffer for streaming assistant message
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat, pendingTrade, streamingContent]);

    const buildContext = useCallback(() => {
        return chat
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .slice(-5)
            .map(msg => ({ role: msg.role, content: msg.content }));
    }, [chat]);

    const sendQuestion = useCallback(async (text) => {
        if (pendingTrade) return;
        setQuestion("");
        setLoading(true);
        setError("");
        setStreamingContent(""); // Clear streaming buffer

        const userTimestamp = new Date().toISOString();
        const newChat = [...chat, { role: "user", content: text, timestamp: userTimestamp }];
        setChat(newChat);

        try {
            const res = await fetch("http://localhost:8000/ask/assistant/stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: text,
                    context: buildContext()
                }),
            });

            if (!res.body || !window.ReadableStream) {
                throw new Error("Streaming not supported in this browser.");
            }

            // Prepare to buffer assistant message content
            let aiMsgContent = "";
            let aiMsgTimestamp = new Date().toISOString();

            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;

            let buffer = "";
            // Tool call buffering state
            let toolCallInProgress = false;
            let toolCallName = null;
            let toolCallArgsBuffer = "";

            // Helper: Try to parse JSON, return null if fails
            const tryParseJSON = (str) => {
                try {
                    return JSON.parse(str);
                } catch {
                    return null;
                }
            };

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    buffer += decoder.decode(value);

                    let lines = buffer.split("\n");
                    buffer = lines.pop();

                    for (let line of lines) {
                        if (!line.trim()) continue;

                        // Try to detect tool call JSON event
                        let isToolCall = false;
                        let toolCallObj = null;
                        try {
                            if (line.trim().startsWith("{") && line.trim().endsWith("}")) {
                                const parsed = JSON.parse(line);
                                if (parsed && parsed.tool_call) {
                                    isToolCall = true;
                                    toolCallObj = parsed.tool_call;
                                }
                            }
                        } catch (e) {
                            aiMsgContent += line;
                            setStreamingContent(aiMsgContent);
                            continue;
                        }

                        if (isToolCall && toolCallObj) {
                            const tool = Array.isArray(toolCallObj) ? toolCallObj[0] : toolCallObj;
                            if (tool.function && tool.function.name) {
                                toolCallInProgress = true;
                                toolCallName = tool.function.name;
                                toolCallArgsBuffer = "";
                            }
                            if (toolCallInProgress) {
                                if (tool.function && typeof tool.function.arguments === "string") {
                                    toolCallArgsBuffer += tool.function.arguments;
                                }
                                const parsedArgs = tryParseJSON(toolCallArgsBuffer);
                                if (parsedArgs !== null) {
                                    if (toolCallName === "submit_trade") {
                                        const confirmMsg = "Please confirm the trade details below before submission.";
                                        setChat(prev => {
                                            const newChat = [
                                                ...prev,
                                                { role: "assistant", content: confirmMsg, timestamp: new Date().toISOString() }
                                            ];
                                            setPendingTrade({
                                                params: parsedArgs,
                                                userQuestion: text,
                                                chatIdx: newChat.length - 1
                                            });
                                            return newChat;
                                        });
                                        toolCallInProgress = false;
                                        toolCallName = null;
                                        toolCallArgsBuffer = "";
                                        done = true;
                                        break;
                                    } else if (toolCallName) {
                                        const functionName = toolCallName;
                                        let apiUrl = "";
                                        let apiBody = {};
                                        let method = "POST";
                                        let args = parsedArgs;
                                        if (functionName === "get_order_details" && args.orderId) {
                                            apiUrl = `http://localhost:8000/trade/status/${args.orderId}`;
                                            method = "GET";
                                        } else if (functionName === "get_account_info") {
                                            apiUrl = "http://localhost:8000/trade/accountInfo";
                                            method = "GET";
                                        } else if (functionName === "get_trade_status" && (args.orderId || args.order_id)) {
                                            const orderId = args.orderId || args.order_id;
                                            apiUrl = `http://localhost:8000/trade/status/${orderId}`;
                                            method = "GET";
                                        } else {
                                            aiMsgContent += `[Unknown function call: ${functionName}]`;
                                            setStreamingContent(aiMsgContent);
                                            toolCallInProgress = false;
                                            toolCallName = null;
                                            toolCallArgsBuffer = "";
                                            done = true;
                                            break;
                                        }
                                        const handleToolCall = async ({
                                            apiUrl,
                                            apiBody,
                                            method,
                                            toolCallName,
                                            setChat,
                                            setStreamingContent,
                                            aiMsgTimestamp,
                                        }) => {
                                            let localAiMsgContent = "";
                                            try {
                                                let apiResult;
                                                if (method === "GET") {
                                                    const res = await fetch(apiUrl);
                                                    apiResult = await res.json();
                                                } else {
                                                    const res = await fetch(apiUrl, {
                                                        method,
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify(apiBody),
                                                    });
                                                    apiResult = await res.json();
                                                }
                                                const humanizerRes = await fetch("http://localhost:8000/ask/humanizer/stream", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        raw: JSON.stringify(apiResult, null, 2),
                                                    }),
                                                });
                                                if (!humanizerRes.body || !window.ReadableStream) {
                                                    throw new Error("Streaming not supported in this browser.");
                                                }
                                                const reader2 = humanizerRes.body.getReader();
                                                const decoder2 = new TextDecoder("utf-8");
                                                let done2 = false;
                                                let buffer2 = "";
                                                localAiMsgContent = "";
                                                setStreamingContent(localAiMsgContent);
                                                while (!done2) {
                                                    const { value: value2, done: doneReading2 } = await reader2.read();
                                                    done2 = doneReading2;
                                                    if (value2) {
                                                        buffer2 += decoder2.decode(value2);
                                                        let lines2 = buffer2.split("\n");
                                                        buffer2 = lines2.pop();
                                                        for (let line2 of lines2) {
                                                            if (!line2.trim()) continue;
                                                            localAiMsgContent += line2;
                                                            setStreamingContent(localAiMsgContent);
                                                        }
                                                    }
                                                }
                                                if (buffer2 && !done2) {
                                                    localAiMsgContent += buffer2;
                                                    setStreamingContent(localAiMsgContent);
                                                }
                                                const normalizedContent = localAiMsgContent.replace(/(\n\s*){3,}/g, '\n\n');
                                                setChat(prev => [...prev, { role: "assistant", content: normalizedContent, timestamp: new Date().toISOString() }]);
                                                setStreamingContent("");
                                            } catch (err2) {
                                                localAiMsgContent += "[Error executing function call or humanizing response]";
                                                setStreamingContent(localAiMsgContent);
                                                setChat(prev => [...prev, { role: "assistant", content: localAiMsgContent, timestamp: new Date().toISOString() }]);
                                                setStreamingContent("");
                                            }
                                        };
                                        handleToolCall({
                                            apiUrl,
                                            apiBody,
                                            method,
                                            toolCallName,
                                            setChat,
                                            setStreamingContent,
                                            aiMsgTimestamp,
                                        });
                                        toolCallInProgress = false;
                                        toolCallName = null;
                                        toolCallArgsBuffer = "";
                                        done = true;
                                        break;
                                    }
                                }
                            }
                        } else {
                            if (line.trim() !== "") {
                                aiMsgContent = await streamTextToUI(line, aiMsgContent, setStreamingContent);
                            }
                        }
                    }
                }
            }
            if (buffer && !done) {
                aiMsgContent += buffer;
                setStreamingContent(aiMsgContent);
            }
            if (aiMsgContent.trim() !== "") {
                setChat(prev => [...prev, { role: "assistant", content: aiMsgContent, timestamp: aiMsgTimestamp }]);
                setStreamingContent("");
            }
        } catch (err) {
            setError('Error connecting to backend.');
            setChat(prev => [
                ...chat,
                { role: "assistant", content: "Backend Error: Unable to fetch.", timestamp: new Date().toISOString() }
            ]);
        }
        setLoading(false);
        setStreamingContent("");
    }, [pendingTrade, chat, buildContext]);

    const handleSampleQuestion = useCallback(async (sample) => {
        if (loading || pendingTrade) return;
        await sendQuestion(sample);
    }, [loading, pendingTrade, sendQuestion]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!question || pendingTrade) return;
        await sendQuestion(question);
    }, [question, pendingTrade, sendQuestion]);

    const confirmationHandlers = {
        onConfirm: async () => {
            setConfirmLoading(true);
            setError("");
            try {
                const res = await fetch("http://localhost:8000/trade/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(pendingTrade.params),
                });
                const result = await res.json();

                const rawConcat = pendingTrade.userQuestion + '\nTrade Submitted:\n' + JSON.stringify(result, null, 2);
                const humanizerRes = await fetch("http://localhost:8000/ask/humanizer/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ raw: rawConcat }),
                });

                if (!humanizerRes.body || !window.ReadableStream) {
                    const data = await humanizerRes.json();
                    if (data.answer) {
                        setChat(prev => [...prev, { role: 'assistant', content: data.answer, timestamp: new Date().toISOString() }]);
                    } else {
                        setChat(prev => [...prev, { role: 'assistant', content: `Trade Submitted:\n${JSON.stringify(result, null, 2)}`, timestamp: new Date().toISOString() }]);
                    }
                } else {
                    const reader = humanizerRes.body.getReader();
                    const decoder = new TextDecoder();
                    let resultStr = '';
                    setStreamingContent("");
                    let streamingContentLocal = "";
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        streamingContentLocal = await streamTextToUI(chunk, streamingContentLocal, setStreamingContent);
                        resultStr += chunk;
                    }
                    setChat(prev => [...prev, { role: 'assistant', content: resultStr.trim() || `Trade Submitted:\n${JSON.stringify(result, null, 2)}`, timestamp: new Date().toISOString() }]);
                    setStreamingContent("");
                }
            } catch (e) {
                setChat(prev => [...prev, { role: 'assistant', content: 'Trade submission failed: ' + (e.message || e), timestamp: new Date().toISOString() }]);
            }
            setPendingTrade(null);
            setConfirmLoading(false);
        },
        onAbort: () => {
            setPendingTrade(null);
            setChat(prev => [...prev, { role: "assistant", content: "Trade submission aborted by user.", timestamp: new Date().toISOString() }]);
        }
    };

    return {
        question,
        setQuestion,
        chat,
        loading,
        error,
        pendingTrade,
        confirmLoading,
        streamingContent,
        chatEndRef,
        handleSampleQuestion,
        handleSubmit,
        confirmationHandlers,
    };
}
