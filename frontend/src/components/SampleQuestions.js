export default function SampleQuestions({ sampleQuestions, onSampleClick, loading, pendingTrade }) {
    return (
        <div className="sample-questions-container">
            {sampleQuestions.map((sample, idx) => (
                <div
                    key={idx}
                    className="sample-question-card"
                    onClick={() => onSampleClick(sample)}
                    style={{
                        cursor: (loading || pendingTrade) ? "not-allowed" : "pointer",
                        opacity: (loading || pendingTrade) ? 0.5 : 1
                    }}
                >
                    {sample}
                </div>
            ))}
        </div>
    );
}