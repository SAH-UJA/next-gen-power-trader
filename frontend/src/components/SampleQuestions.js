import React from "react";

export default function SampleQuestions({ samples, disabled, onSample }) {
    return (
        <div className="sample-questions-container">
            {samples.map((sample, idx) => (
                <div
                    key={idx}
                    className="sample-question-card"
                    onClick={() => !disabled && onSample(sample)}
                    style={{
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1
                    }}
                >
                    {sample}
                </div>
            ))}
        </div>
    );
}