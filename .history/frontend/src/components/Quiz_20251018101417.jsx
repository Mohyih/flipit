// src/components/Quiz.jsx (FINAL CORRECTED VERSION with Redo/Stats/Styling)
import React, { useState, useEffect } from 'react';

const Quiz = ({ set, navigateToDashboard, apiCall }) => {
    // 1. Initial set of cards (read-only from props)
    const originalCards = set.cards;
    
    // 2. Active set of cards used for the current quiz run (mutable state)
    // We start the quiz using ALL original cards.
    const [activeCards, setActiveCards] = useState(originalCards);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false); 
    
    // State to track quiz progress
    const [progress, setProgress] = useState({ correct: 0, incorrect: 0 });
    
    // State to track the INDEXES of cards the user got wrong in the active set
    // We store the INDEX of the card *within the activeCards array*
    const [incorrectCardIndexes, setIncorrectCardIndexes] = useState([]);

    // Constant for the animation delay (must match the CSS transition: 0.8s)
    const CARD_FLIP_DELAY = 800; 

    // Logic to check for finish state and reset flip
    useEffect(() => {
        // Check for finish state based on activeCards length
        if (currentIndex >= activeCards.length && activeCards.length > 0) {
            setQuizFinished(true);
        }
        
        // This ensures the card is reset to front view when the index changes
        setIsFlipped(false); 
        
    }, [currentIndex, activeCards.length]);


    if (activeCards.length === 0 && !quizFinished) {
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
    
    // --- New Functionality: Redo Incorrect Cards ---
    const handleRedoIncorrect = () => {
        // Only run if there are incorrect cards to redo
        if (incorrectCardIndexes.length === 0) return;

        // 1. Get the cards corresponding to the incorrect indices
        // IMPORTANT: We map from the index in the *previous* activeCards run
        const cardsToRedo = incorrectCardIndexes.map(index => activeCards[index]);

        // 2. Reset the quiz for the new set of cards
        setActiveCards(cardsToRedo);
        setCurrentIndex(0);
        setQuizFinished(false);
        setProgress({ correct: 0, incorrect: 0 });
        setIncorrectCardIndexes([]); // Reset tracker for the new run
    };

    // --- Render the Quiz Complete screen with Stats and Redo Option ---
   if (quizFinished) {
    const incorrectCards = set.cards.filter((_, idx) => !answeredCorrectly[idx]);
    return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Quiz Complete! 🎉</h2>
            <p>You finished all {set.cards.length} cards in <strong>{set.title}</strong>.</p>
            <div className="final-stats">
                <p>✅ Correct: {progress.correct}</p>
                <p>❌ Incorrect: {progress.incorrect}</p>
            </div>
            {progress.incorrect > 0 && (
                <button
                    onClick={() => redoIncorrect(incorrectCards)}
                    className="quiz-button-container correct-btn"
                    style={{ marginTop: '20px' }}
                >
                    Retry Incorrect Cards
                </button>
            )}
            <button onClick={navigateToDashboard} className="quiz-exit-btn">
                Return to Dashboard
            </button>
        </div>
    );
}

    // Still quizzing
    const currentCard = activeCards[currentIndex];
    
    if (!currentCard) return <div>Loading next card...</div>;

    const handleCardFlip = () => setIsFlipped(!isFlipped);

    const handleResponse = (isCorrect) => {
        // Update local progress
        setProgress(prev => ({
            ...prev,
            [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1
        }));
        
        // Track the index of the incorrect card in the current activeCards list
        if (!isCorrect) {
            setIncorrectCardIndexes(prev => [...prev, currentIndex]);
        }
        
        // 1. Immediate fix: Unflip the card instantly
        setIsFlipped(false);
        
        // 2. Wait for the animation (800ms) to complete, then change content.
        // This prevents the content flash bug.
        setTimeout(() => {
            setCurrentIndex(prevIndex => prevIndex + 1);
        }, CARD_FLIP_DELAY); 
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Quiz: {set.title}</h2>
            
            {/* Vibrant Progress Indicator */}
            <div className="quiz-progress-indicator">
                Card {currentIndex + 1} of {activeCards.length} 
                | 
                Correct: <span className="progress-highlight-correct">{progress.correct}</span>, 
                Incorrect: <span className="progress-highlight-incorrect">{progress.incorrect}</span>
            </div>
            
            <div className="flip-card-container">
                <div 
                    className={`flip-card ${isFlipped ? 'flipped' : ''}`} 
                    onClick={handleCardFlip} 
                    style={{cursor: 'pointer'}}
                >
                    <div className="card-face card-front">{currentCard.front}</div>
                    <div className="card-face card-back">{currentCard.back}</div>
                </div>
            </div>

            {/* Quiz Buttons: Only visible AFTER flipping */}
            {isFlipped && (
                <div className="quiz-button-container">
                    <button onClick={() => handleResponse(false)} className="incorrect-btn">
                        Needs Review (Incorrect)
                    </button>
                    <button onClick={() => handleResponse(true)} className="correct-btn">
                        I Got It! (Correct)
                    </button>
                </div>
            )}

            {/* Exit Button - using the new stylish secondary-quiz-button class */}
            <button 
                onClick={navigateToDashboard} 
                className="quiz-exit-btn"
            >
                Exit Quiz
            </button>
        </div>
    );
};

export default Quiz;
