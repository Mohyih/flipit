// src/components/Quiz.jsx
import React, { useState, useEffect } from 'react';

const Quiz = ({ set, navigateToDashboard, apiCall }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false); // NEW STATE for termination
    
    // Simple state to track quiz progress (not sent to API in this version)
    const [progress, setProgress] = useState({ correct: 0, incorrect: 0 });

    // Check for finish state
    useEffect(() => {
        if (currentIndex === set.cards.length && set.cards.length > 0) {
            setQuizFinished(true);
        }
    }, [currentIndex, set.cards.length]);


    if (set.cards.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h3>{set.title}</h3>
                <p>This set has no cards! Add some in the editor.</p>
                <button onClick={navigateToDashboard} className="create-set-button" style={{marginTop: '20px'}}>
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    // Render the Quiz Complete screen
    if (quizFinished) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Quiz Complete! 🎉</h2>
                <p>You finished all {set.cards.length} cards in **{set.title}**.</p>
                <p>Final Score: Correct: {progress.correct}, Incorrect: {progress.incorrect}</p>
                <button onClick={navigateToDashboard} className="create-set-button" style={{marginTop: '20px'}}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    // Still quizzing
    const currentCard = set.cards[currentIndex];
    
    const handleCardFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleResponse = (isCorrect) => {
        // NOTE: API call to update the card's streak would go here
        
        // Update local progress
        setProgress(prev => ({
            ...prev,
            [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1
        }));
        
        // Move to the next card
        setTimeout(() => {
            // No modulo operator (%) needed anymore, we just increment and let useEffect check for finish.
            setCurrentIndex(prevIndex => prevIndex + 1);
            setIsFlipped(false);
        }, 800); // Give a bit more time for the flip and a sense of progression
    };
    
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
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

            {/* Quiz Buttons: Only visible AFTER flipping */}
            {isFlipped && (
                <div className="quiz-button-container">
                    <button 
                        onClick={() => handleResponse(false)}
                        className="incorrect-btn" 
                    >
                        Needs Review (Incorrect)
                    </button>
                    <button 
                        onClick={() => handleResponse(true)}
                        className="correct-btn"
                    >
                        I Got It! (Correct)
                    </button>
                </div>
            )}
            
            <button 
                onClick={navigateToDashboard} 
                className="nav-button" 
                style={{marginTop: '40px', background: '#ccc', color: '#333'}}
            >
                Exit Quiz
            </button>
        </div>
    );
};

export default Quiz;