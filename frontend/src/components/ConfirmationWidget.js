export default function ConfirmationWidget({ params, onConfirm, onAbort, loading }) {
    return (
        <div className="confirmation-widget">
            <strong>Confirm Trade Execution</strong>
            <pre style={{
                background: "#eee",
                padding: 10,
                borderRadius: 4,
                maxHeight: 200,
                overflowY: "auto",
                marginTop: 8
            }}>
                {JSON.stringify(params, null, 2)}
            </pre>
            <div className="confirm-actions" style={{ marginTop: 10 }}>
                <button disabled={loading} onClick={onConfirm}>Confirm</button>
                <button disabled={loading} style={{ marginLeft: 8 }} onClick={onAbort}>Abort</button>
            </div>
        </div>
    );
}