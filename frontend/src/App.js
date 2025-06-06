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



  const sendQuestion = async (text) => {
    if (pendingTrade) return;
    setQuestion("");
    setLoading(true);
    setError("");

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

      // Add a new assistant message with empty content
      let aiMsg = { role: "assistant", content: "", timestamp: new Date().toISOString() };
      setChat(prev => [...newChat, aiMsg]);

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
          // Keep the last line in buffer if it's incomplete
          buffer = lines.pop();

          for (let line of lines) {
            if (!line.trim()) continue;

            // DEBUG: Log each line received from backend
            console.log("STREAM LINE:", line);

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
              // If JSON parsing fails, treat as plain text and append to message
              aiMsg.content += line;
              setChat(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...aiMsg };
                return updated;
              });
              continue; // Skip further processing for this line
            }

            if (isToolCall && toolCallObj) {
              // Handle tool call event (fragmented arguments support)
              const tool = Array.isArray(toolCallObj) ? toolCallObj[0] : toolCallObj;
              // If a new tool call starts, reset buffer
              if (tool.function && tool.function.name) {
                toolCallInProgress = true;
                toolCallName = tool.function.name;
                toolCallArgsBuffer = "";
              }
              // Accumulate arguments fragments
              if (toolCallInProgress) {
                if (tool.function && typeof tool.function.arguments === "string") {
                  toolCallArgsBuffer += tool.function.arguments;
                }
                // Try to parse the buffer as JSON only if it is valid
                const parsedArgs = tryParseJSON(toolCallArgsBuffer);
                if (parsedArgs !== null) {
                  // We have a complete arguments object
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
                    // Reset tool call state
                    toolCallInProgress = false;
                    toolCallName = null;
                    toolCallArgsBuffer = "";
                    done = true;
                    break;
                  } else if (toolCallName) {
                    // For all other function calls, execute the function and stream the humanized response
                    const functionName = toolCallName;
                    let apiUrl = "";
                    let apiBody = {};
                    let method = "POST";
                    let args = parsedArgs;
                    // Map function name to backend endpoint
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
                      // Unknown function, just append as text
                      aiMsg.content += `[Unknown function call: ${functionName}]`;
                      setChat(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { ...aiMsg };
                        return updated;
                      });
                      // Reset tool call state
                      toolCallInProgress = false;
                      toolCallName = null;
                      toolCallArgsBuffer = "";
                      done = true;
                      break;
                    }
                    // Call the backend API for the function
                    (async () => {
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
                        // Now stream the humanized response
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
                        aiMsg.content = ""; // Reset content for humanized stream
                        setChat(prev => {
                          const updated = [...prev];
                          updated[updated.length - 1] = { ...aiMsg };
                          return updated;
                        });
                        while (!done2) {
                          const { value: value2, done: doneReading2 } = await reader2.read();
                          done2 = doneReading2;
                          if (value2) {
                            buffer2 += decoder2.decode(value2);
                            let lines2 = buffer2.split("\n");
                            buffer2 = lines2.pop();
                            for (let line2 of lines2) {
                              if (!line2.trim()) continue;
                              aiMsg.content += line2;
                              setChat(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = { ...aiMsg };
                                return updated;
                              });
                            }
                          }
                        }
                        // If anything left in buffer after stream ends, append as text
                        if (buffer2 && !done2) {
                          aiMsg.content += buffer2;
                          setChat(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1] = { ...aiMsg };
                            return updated;
                          });
                        }
                      } catch (err2) {
                        aiMsg.content += "[Error executing function call or humanizing response]";
                        setChat(prev => {
                          const updated = [...prev];
                          updated[updated.length - 1] = { ...aiMsg };
                          return updated;
                        });
                      }
                    })();
                    // Reset tool call state
                    toolCallInProgress = false;
                    toolCallName = null;
                    toolCallArgsBuffer = "";
                    done = true;
                    break;
                  }
                }
                // If not valid JSON, keep buffering until next fragment arrives
              }
              // You can add more tool handling logic here as needed
            } else {
              aiMsg.content += line;
              // Update the last assistant message in chat
              setChat(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...aiMsg };
                return updated;
              });
            }
          }
        }
      }
      // If anything left in buffer after stream ends, append as text
      if (buffer && !done) {
        aiMsg.content += buffer;
        setChat(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...aiMsg };
          return updated;
        });
      }
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
        const res = await fetch("http://localhost:8000/trade/submit", {
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
