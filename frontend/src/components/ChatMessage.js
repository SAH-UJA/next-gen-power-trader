import ReactMarkdown from 'react-markdown';
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
                {msg.streaming
                    ? (
                        <span>
                            {msg.content}
                            <span className="chat-streaming-cursor" style={{ opacity: 0.5 }}>|</span>
                        </span>
                    )
                    : <ReactMarkdown>{msg.content}</ReactMarkdown>
                }
            </span>
        </div>
    );
}
