import React from 'react';

function Header({ onHamburgerClick }) {
    return (
        <header className="chat-header">
            <button
                className="hamburger-btn"
                aria-label="Open menu"
                onClick={onHamburgerClick}
                title="Toggle Trade Monitor"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="6" width="16" height="2" fill="#333" />
                    <rect x="4" y="11" width="16" height="2" fill="#333" />
                    <rect x="4" y="16" width="16" height="2" fill="#333" />
                </svg>
            </button>
            <span className="header-title">Next-Gen Power Trader</span>
        </header >
    );
}

export default Header;