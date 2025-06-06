import React, { Fragment } from 'react';
import ChatMessage from './ChatMessage';
import ConfirmationWidget from './ConfirmationWidget';

export default function ChatWindow({ chat, pendingTrade, confirmLoading, confirmationHandlers, chatEndRef }) {
    return (
        <main className="chat-window">
            {chat.map((msg, idx) => {
                const msgNode = <ChatMessage key={idx} msg={msg} />;
                if (
                    pendingTrade &&
                    msg.role === "assistant" &&
                    idx === pendingTrade.chatIdx &&
                    msg.content.includes("Please confirm the trade details") &&
                    pendingTrade.params &&
                    typeof pendingTrade.params === "object" &&
                    Object.keys(pendingTrade.params).length > 0
                ) {
                    return (
                        <Fragment key={idx}>
                            {msgNode}
                            <ConfirmationWidget
                                params={pendingTrade.params}
                                loading={confirmLoading}
                                onConfirm={confirmationHandlers.onConfirm}
                                onAbort={confirmationHandlers.onAbort}
                            />
                        </Fragment>
                    );
                } else {
                    return msgNode;
                }
            })}
            <div ref={chatEndRef} />
        </main>
    );
}
