import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingTrade, setPendingTrade] = useState(null); // {params, userQuestion, chatIdx}
  const [confirmLoading, setConfirmLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 1. Add the sample questions array
  const sampleQuestions = [
    "What all can you do?",
    "Buy 10 GOOGL stocks",
    "What are the pros of ETFs over MFs?"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, pendingTrade]);

  const buildContext = () => {
    return chat
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-5)
      .map(msg => ({ role: msg.role, content: msg.content }));
  };

  const humanizeStructuredReply = async (prevMessage, apiReply) => {
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
  };

  const handleToolCall = async (toolConfig, prevMessage, newChatArr) => {
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
  };

  // For both sample and input submit
  const sendQuestion = async (text) => {
    if (pendingTrade) return;
    setQuestion("");
    setLoading(true);
    setError("");

    const userTimestamp = new Date().toISOString();
    const newChat = [...chat, { role: "user", content: text, timestamp: userTimestamp }];
    setChat(newChat);

    try {
      const res = await fetch("https://next-gen-power-trader-app-latest.onrender.com/ask/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          context: buildContext()
        }),
      });
      const data = await res.json();

      let reply = "";
      if (data.answer) {
        reply = data.answer;
      } else if (data.tool_config) {
        try {
          reply = await handleToolCall(data.tool_config, text, newChat);
        } catch (te) {
          reply = "Tool Error: " + te.message;
        }
      } else {
        reply = "No answer or tool configuration received.";
      }
      setChat(prev => [
        ...newChat,
        { role: "assistant", content: reply, timestamp: new Date().toISOString() }
      ]);
    } catch (err) {
      setError('Error connecting to backend.');
      setChat(prev => [
        ...chat,
        { role: "assistant", content: "Backend Error: Unable to fetch.", timestamp: new Date().toISOString() }
      ]);
    }
    setLoading(false);
  };

  // 2. Function to handle clicking a sample card
  const handleSampleQuestion = async (sample) => {
    if (loading || pendingTrade) return;
    await sendQuestion(sample);
  };

  // User text submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || pendingTrade) return;
    await sendQuestion(question);
  };

  // The inline confirmation component
  const ConfirmationWidget = ({ params, onConfirm, onAbort, loading }) => (
    <div className="confirmation-widget">
      <strong>Confirm Trade Execution</strong>
      <pre style={{
        background: "#eee",
        padding: 10,
        borderRadius: 4,
        maxHeight: 200,
        overflowY: "auto",
        marginTop: 8
      }}>
        {JSON.stringify(params, null, 2)}
      </pre>
      <div className="confirm-actions" style={{ marginTop: 10 }}>
        <button
          disabled={loading}
          onClick={onConfirm}
        >Confirm</button>
        <button
          disabled={loading}
          style={{ marginLeft: 8 }}
          onClick={onAbort}
        >Abort</button>
      </div>
    </div>
  );

  return (
    <div className="chat-app-container">
      <header className="chat-header">Next-Gen Power Trader</header>
      <main className="chat-window">
        {chat.length === 0 && (
          <>
            <div className="chat-empty">Ask a question to get started!</div>
            {/* Sample Question Cards */}
            <div className="sample-questions-container">
              {sampleQuestions.map((sample, idx) => (
                <div
                  key={idx}
                  className="sample-question-card"
                  onClick={() => handleSampleQuestion(sample)}
                  style={{
                    cursor: (loading || pendingTrade) ? "not-allowed" : "pointer",
                    opacity: (loading || pendingTrade) ? 0.5 : 1
                  }}
                >
                  {sample}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Render chat, and conditionally show confirmation widget below "please confirm" */}
        {chat.map((msg, idx) => {
          const roleLabel = msg.role === 'user' ? "You" : "Assistant";
          const timeStr = formatTime(msg.timestamp);

          const msgNode = (
            <div
              key={idx}
              className={`chat-message ${msg.role === 'user' ? "chat-user" : "chat-assistant"}`}
            >
              <div className="chat-meta">
                <span className="chat-role">{roleLabel}</span>
                <span className="chat-time">{timeStr}</span>
              </div>
              <span className="chat-bubble">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </span>
            </div>
          );
          // If this is the assistant "please confirm" message, render the confirmation widget just after it
          if (
            pendingTrade &&
            msg.role === "assistant" &&
            idx === pendingTrade.chatIdx &&
            msg.content.includes("Please confirm the trade details")
          ) {
            return (
              <React.Fragment key={idx}>
                {msgNode}
                <ConfirmationWidget
                  params={pendingTrade.params}
                  loading={confirmLoading}
                  onConfirm={async () => {
                    setConfirmLoading(true);
                    setError("");
                    try {
                      const res = await fetch("https://next-gen-power-trader-app-latest.onrender.com/trade/submit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(pendingTrade.params),
                      });
                      const result = await res.json();
                      const humanized = await humanizeStructuredReply(
                        pendingTrade.userQuestion,
                        "Trade Submitted:\n" + JSON.stringify(result, null, 2)
                      );
                      setChat(prev => [...prev, { role: 'assistant', content: humanized, timestamp: new Date().toISOString() }]);
                    } catch (e) {
                      setChat(prev => [...prev, { role: 'assistant', content: 'Trade submission failed: ' + (e.message || e), timestamp: new Date().toISOString() }]);
                    }
                    setPendingTrade(null);
                    setConfirmLoading(false);
                  }}
                  onAbort={() => {
                    setPendingTrade(null);
                    setChat(prev => [...prev, { role: "assistant", content: "Trade submission aborted by user.", timestamp: new Date().toISOString() }]);
                  }}
                />
              </React.Fragment>
            );
          } else {
            return msgNode;
          }
        })}
        <div ref={chatEndRef} />
      </main>
      {error && <div className="chat-error">{error}</div>}
      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={loading ? "Waiting for a reply..." : "Type your message..."}
            autoFocus
            disabled={loading || pendingTrade}
          />
          <button type="submit" disabled={loading || !question || pendingTrade} aria-label="Send">
            {!loading ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
                <path d="M4 20L20 12L4 4V10L16 12L4 14V20Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <span style={{ fontSize: 22 }}>...</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;