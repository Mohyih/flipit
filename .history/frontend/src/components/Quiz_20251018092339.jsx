// src/components/Quiz.jsx
import React, { useState, useEffect } from 'react';

const Quiz = ({ set, navigateToDashboard }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [progress, setProgress] = useState({ correct: 0, incorrect: 0 });
    const [incorrectCards, setIncorrectCards] = useState([]);

    useEffect(() => {
        if (currentIndex >= set.cards.length && set.cards.length > 0) {
            setQuizFinished(true);
        }
    }, [currentIndex, set.cards.length]);

    const currentCard = set.cards[currentIndex];
    if (!currentCard && !quizFinished) return <div>Loading next card...</div>;

    const handleCardFlip = () => setIsFlipped(!isFlipped);

    const handleResponse = (isCorrect) => {
        setProgress(prev => ({
            ...prev,
            [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1
        }));

        if (!isCorrect) setIncorrectCards(prev => [...prev, currentCard]);

        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    };

    const redoIncorrect = () => {
        setCurrentIndex(0);
        setProgress({ correct: 0, incorrect: 0 });
        setQuizFinished(false);
        setIncorrectCards(incorrectCards); // Only retry incorrect cards
        set.cards = incorrectCards; // temporary override
    };

    if (set.cards.length === 0) {
        return (
            <div className="quiz-container">
                <h3>{set.title}</h3>
                <p>This set has no cards! Add some in the editor.</p>
                <button onClick={navigateToDashboard} className="quiz-nav-btn">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (quizFinished) {
        return (
            <div className="quiz-container">
                <h2>Quiz Complete! 🎉</h2>
                <p>You finished all {set.cards.length} cards in <strong>{set.title}</strong>.</p>
                <p>Final Score: Correct: {progress.correct}, Incorrect: {progress.incorrect}</p>
                {incorrectCards.length > 0 && (
                    <button onClick={redoIncorrect} className="quiz-btn">
                        Retry Incorrect Cards
                    </button>
                )}
                <button onClick={navigateToDashboard} className="quiz-btn">
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <h2>Quiz: {set.title}</h2>
            <div className="progress-display">
                Card {currentIndex + 1} of {set.cards.length} | ✅ {progress.correct} | ❌ {progress.incorrect}
            </div>

            <div className="flip-card-container">
                <div
                    className={`flip-card ${isFlipped ? 'flipped' : ''}`}
                    onClick={handleCardFlip}
                >
                    <div className="card-face card-front">{currentCard.front}</div>
                    <div className="card-face card-back">{currentCard.back}</div>
                </div>
            </div>

            {isFlipped && (
                <div className="quiz-button-container">
                    <button onClick={() => handleResponse(false)} className="incorrect-btn">
                        Needs Review
                    </button>
                    <button onClick={() => handleResponse(true)} className="correct-btn">
                        I Got It!
                    </button>
                </div>
            )}

            <button className="quiz-btn" onClick={navigateToDashboard}>
                Exit Quiz
            </button>
        </div>
    );
};

export default Quiz;
