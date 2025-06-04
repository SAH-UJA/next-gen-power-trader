import React, { useState, useRef, useEffect } from 'react';
import './App.css';

import { sampleQuestions } from './constants';
import { humanizeStructuredReply } from './utils';

import SampleQuestions from './components/SampleQuestions';
import ChatWindow from './components/ChatWindow';
import ChatInputBar from './components/ChatInputBar';

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

  const buildContext = () => {
    return chat
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-5)
      .map(msg => ({ role: msg.role, content: msg.content }));
  };

  const handleToolCall = async (toolConfig, prevMessage, newChatArr) => {
    if (!toolConfig || !toolConfig.function) throw new Error("No tool config found.");

    if (toolConfig.function === "submit_trade") {
      const confirmMsg = "Please confirm the trade details below before submission.";
      const chatIdx = newChatArr.length;
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
        throw new Error("Unknown tool function requested.");
      }
      const humanized = await humanizeStructuredReply(prevMessage, apiReply);
      return humanized;
    } catch (e) {
      throw new Error("Error in tool API: " + (e.message || e));
    }
  };

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

  const handleSampleQuestion = async (sample) => {
    if (loading || pendingTrade) return;
    await sendQuestion(sample);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || pendingTrade) return;
    await sendQuestion(question);
  };

  // Confirmation widget action handlers for ChatWindow
  const confirmationHandlers = {
    onConfirm: async () => {
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
    },
    onAbort: () => {
      setPendingTrade(null);
      setChat(prev => [...prev, { role: "assistant", content: "Trade submission aborted by user.", timestamp: new Date().toISOString() }]);
    }
  };

  return (
    <div className="chat-app-container">
      <header className="chat-header">Next-Gen Power Trader</header>
      {chat.length === 0 && (
        <>
          <div className="chat-empty">Ask a question to get started!</div>
          <SampleQuestions
            sampleQuestions={sampleQuestions}
            onSampleClick={handleSampleQuestion}
            loading={loading}
            pendingTrade={pendingTrade}
          />
        </>
      )}
      <ChatWindow
        chat={chat}
        pendingTrade={pendingTrade}
        confirmLoading={confirmLoading}
        confirmationHandlers={confirmationHandlers}
        chatEndRef={chatEndRef}
      />
      {error && <div className="chat-error">{error}</div>}
      <ChatInputBar
        question={question}
        setQuestion={setQuestion}
        loading={loading}
        pendingTrade={pendingTrade}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

export default App;