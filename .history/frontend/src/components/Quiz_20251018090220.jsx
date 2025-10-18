// src/components/Quiz.jsx (FINAL CORRECTED VERSION)
import React, { useState, useEffect } from 'react';

const Quiz = ({ set, navigateToDashboard, apiCall }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false); 
    
    // Simple state to track quiz progress (not sent to API in this version)
    const [progress, setProgress] = useState({ correct: 0, incorrect: 0 });

    // 🚩 FIX: This useEffect now monitors currentIndex and forces the card to UNFLIP
    // the moment a new card is loaded, preventing the brief answer flash.
    useEffect(() => {
        // 1. Check for finish state
        if (currentIndex >= set.cards.length && set.cards.length > 0) {
            setQuizFinished(true);
        }
        
        // 2. IMMEDIATE FIX: Ensure the card is always unflipped when a new index is loaded.
        // This runs instantly whenever setCurrentIndex(prevIndex + 1) is called below.
        setIsFlipped(false); 
        
    }, [currentIndex, set.cards.length]); // Dependency on currentIndex is crucial for the fix


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
    
    if (!currentCard) {
        return <div>Loading next card...</div>; 
    }
    
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
        
        // Move to the next card after a visual pause.
        setTimeout(() => {
            // This updates the index, which triggers the useEffect hook above
            // to instantly set isFlipped to false.
            setCurrentIndex(prevIndex => prevIndex + 1);
            // REMOVED: setIsFlipped(false) is now handled by useEffect.
        }, 800); 
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