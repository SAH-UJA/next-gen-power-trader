import React from 'react';

export default function ChatInputBar({ question, setQuestion, loading, pendingTrade, handleSubmit }) {
    return (
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
    );
}