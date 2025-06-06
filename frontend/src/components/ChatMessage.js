import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatTime } from '../utils';

export default function ChatMessage({ msg }) {
    const roleLabel = msg.role === 'user' ? "You" : "Assistant";
    const timeStr = formatTime(msg.timestamp);

    return (
        <div className={`chat-message ${msg.role === 'user' ? "chat-user" : "chat-assistant"}`}>
            <div className="chat-meta">
                <span className="chat-role">{roleLabel}</span>
                <span className="chat-time">{timeStr}</span>
            </div>
            <span className="chat-bubble">
                {/* 
                  Only render markdown for fully received (non-streaming) messages.
                  For streaming messages, render plain text with a cursor.
                */}
                {msg.streaming ? (
                    <span>
                        {msg.content}
                        <span className="chat-streaming-cursor" style={{ opacity: 0.5 }}>|</span>
                    </span>
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                    </ReactMarkdown>
                )}
            </span>
        </div>
    );
}
