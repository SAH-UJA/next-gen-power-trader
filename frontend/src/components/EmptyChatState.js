import React from 'react';
import SampleQuestions from './SampleQuestions';
import { sampleQuestions } from '../constants';

function EmptyChatState({ onSampleClick, loading, pendingTrade }) {
    return (
        <>
            <div className="chat-empty">Ask a question to get started!</div>
            <SampleQuestions
                sampleQuestions={sampleQuestions}
                onSampleClick={onSampleClick}
                loading={loading}
                pendingTrade={pendingTrade}
            />
        </>
    );
}

export default EmptyChatState;
