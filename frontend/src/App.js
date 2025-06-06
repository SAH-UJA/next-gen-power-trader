import React, { useState } from 'react';
import './App.css';

import EmptyChatState from './components/EmptyChatState';
import ChatWindow from './components/ChatWindow';
import ChatInputBar from './components/ChatInputBar';
import Header from './components/Header';
import ErrorBanner from './components/ErrorBanner';
import useChat from './hooks/useChat';
import TradeTableSidebar from './components/TradeTableSidebar';

function App() {
  const {
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
  } = useChat();
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="chat-app-container">
      <Header onHamburgerClick={() => setShowSidebar(v => !v)} />
      <TradeTableSidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
      {chat.length === 0 && (
        <EmptyChatState
          onSampleClick={handleSampleQuestion}
          loading={loading}
          pendingTrade={pendingTrade}
        />
      )}
      <ChatWindow
        chat={streamingContent
          ? [...chat, { role: "assistant", content: streamingContent, timestamp: new Date().toISOString(), streaming: true }]
          : chat}
        pendingTrade={pendingTrade}
        confirmLoading={confirmLoading}
        confirmationHandlers={confirmationHandlers}
        chatEndRef={chatEndRef}
      />
      <ErrorBanner error={error} />
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
