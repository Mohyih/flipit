import React, { useState, useEffect } from 'react';

const Quiz = ({ set, navigateToDashboard, apiCall }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [progress, setProgress] = useState({ correct: 0, incorrect: 0 });
    const [incorrectCards, setIncorrectCards] = useState([]);
    const [currentQuizCards, setCurrentQuizCards] = useState(set.cards);
    
    // NEW STATE: Tracks the outcome of the last response for styling feedback
    const [responseState, setResponseState] = useState(null); 

    useEffect(() => {
        if (set.cards.length > 0 && currentQuizCards.length === 0) {
              setCurrentQuizCards(set.cards);
        }
    }, [set.cards]);

    useEffect(() => {
        if (currentIndex >= currentQuizCards.length && currentQuizCards.length > 0) {
            setQuizFinished(true);
        }
    }, [currentIndex, currentQuizCards.length]);

    // Handle empty set display (no change)
    if (set.cards.length === 0 && !quizFinished) { 
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

    const handleRedoIncorrect = () => {
        setCurrentQuizCards(incorrectCards);
        setIncorrectCards([]);
        setCurrentIndex(0);
        setProgress({ correct: 0, incorrect: 0 });
        setIsFlipped(false);
        setQuizFinished(false);
    };

    // Quiz Finished Screen (no change)
    if (quizFinished) {
        const quizAttemptTotal = progress.correct + progress.incorrect;
        const percentageCorrect = quizAttemptTotal > 0 ? ((progress.correct / quizAttemptTotal) * 100).toFixed(0) : 0;

        return (
            <div className="quiz-completion-container">
                <h2>Quiz Complete! 🎉</h2>
                <p>You finished all {currentQuizCards.length} cards in <strong>{set.title}</strong>.</p>
                <div className="quiz-stats-summary">
                    <div className="stat-item correct-stat">
                        <h3>Correct</h3>
                        <p>{progress.correct}</p>
                    </div>
                    <div className="stat-item incorrect-stat">
                        <h3>Incorrect</h3>
                        <p>{progress.incorrect}</p>
                    </div>
                    <div className="stat-item percentage-stat">
                        <h3>Accuracy</h3>
                        <p>{percentageCorrect}%</p>
                    </div>
                </div>

                {incorrectCards.length > 0 && (
                    <button onClick={handleRedoIncorrect} className="quiz-action-button redo-incorrect-btn">
                        Redo {incorrectCards.length} Incorrect Cards
                    </button>
                )}
                <button onClick={navigateToDashboard} className="quiz-action-button return-dashboard-btn" style={{marginTop: incorrectCards.length > 0 ? '10px' : '20px'}}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const currentCard = currentQuizCards[currentIndex];
    if (!currentCard) return <div>Loading next card...</div>;

    const handleCardFlip = () => setIsFlipped(!isFlipped);

    const handleResponse = (isCorrect) => {
        // 1. Update progress and track incorrect cards
        setProgress(prev => ({
            ...prev,
            [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1
        }));

        if (!isCorrect) {
            setIncorrectCards(prev => {
                if (!prev.includes(currentCard)) {
                    return [...prev, currentCard];
                }
                return prev;
            });
        }
        
        // 2. Set the response state for visual feedback
        setResponseState(isCorrect ? 'correct' : 'incorrect');

        // 3. Unflip immediately
        setIsFlipped(false);

        // 4. Advance to the next card and clear the response state after a short delay
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setResponseState(null); // Clear feedback state for the next card
        }, 300);
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            {/* 🛑 FIX: Apply truncation and max-width to contain long titles */}
            <h2 className="text-truncate" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
                Quiz: {set.title}
            </h2>
            
            {/* Modern Progress Bar (no change) */}
            <div className="quiz-progress-bar-container">
                <div className="progress-segment">
                    <span className="progress-label">Card</span>
                    <span className="progress-value">{currentIndex + 1} / {currentQuizCards.length}</span>
                </div>
                <div className="progress-segment correct-segment">
                    <span className="progress-label">Correct</span>
                    <span className="progress-value">{progress.correct}</span>
                </div>
                <div className="progress-segment incorrect-segment">
                    <span className="progress-label">Incorrect</span>
                    <span className="progress-value">{progress.incorrect}</span>
                </div>
            </div>
            
            <div className="flip-card-container">
                <div
                    // MODIFIED CLASS: Add responseState class if present
                    className={`flip-card ${isFlipped ? 'flipped' : ''} ${responseState}`}
                    onClick={handleCardFlip}
                    style={{cursor: 'pointer'}}
                >
                    <div className="card-face card-front">{currentCard.front}</div>
                    <div className="card-face card-back">{currentCard.back}</div>
                </div>
            </div>
            {isFlipped && (
                <div className="quiz-button-container">
                    <button onClick={() => handleResponse(false)} className="incorrect-btn quiz-response-btn">
                        (Incorrect
                    </button>
                    <button onClick={() => handleResponse(true)} className="correct-btn quiz-response-btn">
                        I Got It! (Correct)
                    </button>
                </div>
            )}
            <button
                onClick={navigateToDashboard}
                className="quiz-action-button exit-quiz-btn"
            >
                Exit Quiz
            </button>
        </div>
    );
};

export default Quiz;