import React, { useState, useEffect } from "react";
import "./TradeTableSidebar.css";

const STATUS_OPTIONS = ["all", "open", "closed", "expired", "canceled", "filled"];

function TradeTableSidebar({ visible, onClose, status: initialStatus = "all", limit: initialLimit = 20 }) {
    const [trades, setTrades] = useState([]);
    const [error, setError] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);

    // Filter state
    const [status, setStatus] = useState(initialStatus);
    const [limit, setLimit] = useState(initialLimit);
    const [after, setAfter] = useState("");
    const [until, setUntil] = useState("");
    const [symbols, setSymbols] = useState(""); // comma-separated input

    useEffect(() => {
        if (!visible) return;

        const fetchTrades = () => {
            setError(null);

            // Build query params
            const params = new URLSearchParams();
            if (status) params.append("status", status);
            if (limit) params.append("limit", limit);
            if (after) params.append("after", after);
            if (until) params.append("until", until);
            if (symbols) {
                // Send as repeated query param if multiple symbols
                symbols
                    .split(",")
                    .map(sym => sym.trim())
                    .filter(Boolean)
                    .forEach(sym => params.append("symbols", sym));
            }

            fetch(`https://next-gen-power-trader-app-latest.onrender.com/trade/trades?${params.toString()}`)
                .then(response => {
                    if (!response.ok) throw new Error("Network response was not ok");
                    return response.json();
                })
                .then(data => setTrades(data))
                .catch(() => setError("Error fetching trades"));
        };

        fetchTrades();
        const intervalId = setInterval(fetchTrades, 10000);
        return () => clearInterval(intervalId);
    },
        [visible, status, limit, after, until, symbols]
    );

    // Handle datetime-local input to ISO string
    const handleAfterChange = e => {
        const value = e.target.value;
        setAfter(value ? new Date(value).toISOString() : "");
    };
    const handleUntilChange = e => {
        const value = e.target.value;
        setUntil(value ? new Date(value).toISOString() : "");
    };

    return (
        <>
            <div
                className={`sidebar-overlay${visible ? " sidebar-overlay--show" : ""}`}
                onClick={onClose}
            />
            <aside className={`sidebar${visible ? " sidebar--open" : ""}`}>
                <button className="sidebar-close-btn" onClick={onClose} title="Close">&times;</button>
                <h2 className="sidebar-title">Trades</h2>

                <div className="sidebar-filters">
                    <div>
                        <label>Status:</label>
                        <select value={status} onChange={e => setStatus(e.target.value)}>
                            {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Limit:</label>
                        <input
                            type="number"
                            min="1"
                            max="200"
                            value={limit}
                            onChange={e => setLimit(Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label>Symbols (comma-separated):</label>
                        <input
                            type="text"
                            value={symbols}
                            onChange={e => setSymbols(e.target.value)}
                            placeholder="e.g. AAPL,TSLA"
                        />
                    </div>
                    <div>
                        <label>After:</label>
                        <input
                            type="datetime-local"
                            onChange={handleAfterChange}
                        />
                    </div>
                    <div>
                        <label>Until:</label>
                        <input
                            type="datetime-local"
                            onChange={handleUntilChange}
                        />
                    </div>
                </div>

                {error && <div className="sidebar-error">{error}</div>}
                <div className="sidebar-table-container">
                    <table className="trade-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Qty</th>
                                <th>Side</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((trade, idx) => (
                                <tr
                                    key={trade.id}
                                    className={
                                        hoveredRow === idx
                                            ? "trade-table__row--hover"
                                            : idx % 2 === 0
                                                ? "trade-table__row--even"
                                                : "trade-table__row--odd"
                                    }
                                    onMouseEnter={() => setHoveredRow(idx)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    <td>{trade.symbol}</td>
                                    <td>{trade.qty}</td>
                                    <td>{trade.side}</td>
                                    <td>{trade.order_type || trade.type}</td>
                                    <td
                                        className={
                                            trade.status === "filled"
                                                ? "status--filled"
                                                : trade.status === "canceled"
                                                    ? "status--canceled"
                                                    : ""
                                        }
                                    >
                                        {trade.status}
                                    </td>
                                    <td>{trade.created_at ? new Date(trade.created_at).toLocaleString() : ""}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </aside>
        </>
    );
}

export default TradeTableSidebar;