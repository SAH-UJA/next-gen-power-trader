import React from "react";

function ErrorBanner({ error }) {
    if (!error) return null;
    return (
        <div className="chat-error">
            {error}
        </div>
    );
}

export default ErrorBanner;
