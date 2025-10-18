// src/components/Quiz.jsx
import React, { useState } from 'react';

const Quiz = ({ set, navigateToDashboard }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Simple state to track quiz progress (not sent to API in this version)
    const [progress, setProgress] = useState({ correct: 0, incorrect: 0 });

    const currentCard = set.cards[currentIndex];
    
    if (set.cards.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3>{set.title}</h3>
                <p>This set has no cards! Add some in the editor.</p>
                <button onClick={navigateToDashboard} style={{marginTop: '20px'}}>Back to Dashboard</button>
            </div>
        );
    }

    const handleCardFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleResponse = (isCorrect) => {
        // Update local progress
        setProgress(prev => ({
            ...prev,
            [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1
        }));
        
        // Move to the next card
        setTimeout(() => {
            const nextIndex = (currentIndex + 1) % set.cards.length;
            setCurrentIndex(nextIndex);
            setIsFlipped(false);
        }, 500); // Give time for flip animation
    };
    
    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Quiz: {set.title}</h2>
            <p>Card {currentIndex + 1} of {set.cards.length} | Correct: {progress.correct}, Incorrect: {progress.incorrect}</p>
            
            <div className="flip-card-container">
                <div 
                    className={`flip-card ${isFlipped ? 'flipped' : ''}`} 
                    onClick={handleCardFlip} 
                    style={{cursor: 'pointer'}}
                >
                    <div className="card-face card-front">
                        {currentCard.front}
                    </div>
                    <div className="card-face card-back">
                        {currentCard.back}
                    </div>
                </div>
            </div>

            {isFlipped && (
                <div style={{ marginTop: '30px' }}>
                    <button 
                        onClick={() => handleResponse(true)}
                        style={{ padding: '10px 20px', margin: '0 10px', background: '#28a745', color: 'white' }}
                    >
                        I Got It! (Correct)
                    </button>
                    <button 
                        onClick={() => handleResponse(false)}
                        style={{ padding: '10px 20px', margin: '0 10px', background: '#dc3545', color: 'white' }}
                    >
                        Needs Review (Incorrect)
                    </button>
                </div>
            )}
            
            <button onClick={navigateToDashboard} style={{marginTop: '30px', background: '#ccc', color: '#333'}}>
                Exit Quiz
            </button>
        </div>
    );
};

export default Quiz;