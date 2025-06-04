import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "./components/ChatMessage";
import ConfirmationWidget from "./components/ConfirmationWidget";
import SampleQuestions from "./components/SampleQuestions";
import { buildContext, humanizeStructuredReply, handleToolCall } from "./hooks/useChatApi";
import "./App.css";

const SAMPLE_QUESTIONS = [
  "What all can you do?",
  "Buy 10 GOOGL stocks",
  "What are the pros of ETFs over MFs?"
];

function App() {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingTrade, setPendingTrade] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, pendingTrade]);

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
          context: buildContext(chat)
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

  const handleSampleQuestion = (sample) => {
    if (loading || pendingTrade) return;
    sendQuestion(sample);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question || pendingTrade) return;
    sendQuestion(question);
  };

  return (
    <div className="chat-app-container">
      <header className="chat-header">Next-Gen Power Trader</header>
      <main className="chat-window">
        {chat.length === 0 && (
          <>
            <div className="chat-empty">Ask a question to get started!</div>
            <SampleQuestions
              samples={SAMPLE_QUESTIONS}
              disabled={loading || pendingTrade}
              onSample={handleSampleQuestion}
            />
          </>
        )}
        {chat.map((msg, idx) => {
          if (
            pendingTrade &&
            msg.role === "assistant" &&
            idx === pendingTrade.chatIdx &&
            msg.content.includes("Please confirm the trade details")
          ) {
            return (
              <React.Fragment key={idx}>
                <ChatMessage msg={msg} />
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
          }
          return <ChatMessage key={idx} msg={msg} />;
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