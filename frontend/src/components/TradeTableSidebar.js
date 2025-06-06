import React, { useState, useEffect } from "react";
import "./TradeTableSidebar.css";

function TradeTableSidebar({ visible, onClose, status = "all", limit = 20 }) {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);

    useEffect(() => {
        if (!visible) return;
        const fetchTrades = () => {
            setLoading(true);
            setError(null);
            fetch(`http://localhost:8000/trade/trades?status=${status}&limit=${limit}`)
                .then(response => {
                    if (!response.ok) throw new Error("Network response was not ok");
                    return response.json();
                })
                .then(data => setTrades(data))
                .catch(() => setError("Error fetching trades"))
                .finally(() => setLoading(false));
        };
        fetchTrades();
        const intervalId = setInterval(fetchTrades, 10000);
        return () => clearInterval(intervalId);
    }, [status, limit, visible]);

    return (
        <>
            <div
                className={`sidebar-overlay${visible ? " sidebar-overlay--show" : ""}`}
                onClick={onClose}
            />
            <aside className={`sidebar${visible ? " sidebar--open" : ""}`}>
                <button className="sidebar-close-btn" onClick={onClose} title="Close">&times;</button>
                <h2 className="sidebar-title">Trades</h2>
                {error && <div className="sidebar-error">{error}</div>}
                {loading && trades.length === 0 && <div className="sidebar-loading">Loading...</div>}
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
                                    <td>{trade.order_type}</td>
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
                                    <td>{new Date(trade.created_at).toLocaleString()}</td>
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