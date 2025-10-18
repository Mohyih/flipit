import React, { useState, useEffect } from 'react';

const Quiz = ({ set, navigateToDashboard }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [progress, setProgress] = useState({ correct: 0, incorrect: 0 });
    const [incorrectCards, setIncorrectCards] = useState([]);

    const currentCard = set.cards[currentIndex];

    useEffect(() => {
        if (currentIndex >= set.cards.length && set.cards.length > 0) {
            setQuizFinished(true);
        }
    }, [currentIndex, set.cards.length]);

    if (!currentCard && !quizFinished) return <div>Loading...</div>;

    const handleCardFlip = () => setIsFlipped(!isFlipped);

    const handleResponse = (isCorrect) => {
        setProgress(prev => ({
            ...prev,
            [isCorrect ? 'correct' : 'incorrect']: prev[isCorrect ? 'correct' : 'incorrect'] + 1
        }));

        if (!isCorrect) {
            setIncorrectCards(prev => [...prev, currentCard]);
        }

        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    };

    const redoIncorrect = () => {
        setCurrentIndex(0);
        setProgress({ correct: 0, incorrect: 0 });
        setQuizFinished(false);
        setIsFlipped(false);
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
        setProgress({ correct: 0, incorrect: 0 });
    };

    if (quizFinished) {
        return (
            <div className="quiz-end-container">
                <h2>Quiz Complete! 🎉</h2>
                <div className="quiz-end-stats">
                    <p>Total Cards: {set.cards.length}</p>
                    <p>Correct: {progress.correct}</p>
                    <p>Incorrect: {progress.incorrect}</p>
                </div>
                {incorrectCards.length > 0 && (
                    <button className="quiz-button correct-btn" onClick={redoIncorrect}>
                        Retry Incorrect Cards
                    </button>
                )}
                <button className="quiz-button nav-btn" onClick={navigateToDashboard}>
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <h2>Quiz: {set.title}</h2>
            <div className="quiz-status-card">
                Card {currentIndex + 1} of {set.cards.length} | Correct: {progress.correct}, Incorrect: {progress.incorrect}
            </div>

            <div className="flip-card-container">
                <div 
                    className={`flip-card ${isFlipped ? 'flipped' : ''}`} 
                    onClick={handleCardFlip} 
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-face card-front">{currentCard.front}</div>
                    <div className="card-face card-back">{currentCard.back}</div>
                </div>
            </div>

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

            <button className="quiz-button nav-btn" onClick={navigateToDashboard}>
                Exit Quiz
            </button>
        </div>
    );
};

export default Quiz;
