import React, { useState, useEffect } from 'react';

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, user }) => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSets = async () => {
            setLoading(true);
            setError(null);
            try {
                // In a real app, this would use the apiCall function:
                // const data = await apiCall('/sets');
                
                // Mock data now includes the 'description' field
                await new Promise(resolve => setTimeout(resolve, 800)); 
                const mockSets = [
                    { set_id: 1, title: 'React Hooks Basics', description: 'Essential hooks like useState and useEffect.', card_count: 5 },
                    { set_id: 2, title: 'CSS Flexbox Properties', description: 'A detailed look at align-items, justify-content, and flex-grow.', card_count: 8 },
                    { set_id: 3, title: 'Key History Dates', description: 'Dates for major world events from 1700 to 1950.', card_count: 12, },
                ];
                setSets(mockSets);
            } catch (err) {
                // setError(err.message); // Use this in a real app
                setError("Failed to load sets from the server.");
            } finally {
                setLoading(false);
            }
        };

        fetchSets();
    }, [apiCall]);

    const handleDelete = (setId) => {
        if (window.confirm(`Are you sure you want to delete this set?`)) {
            // In a real app, use apiCall(`/sets/${setId}`, 'DELETE').then(...)
            // Mock delete
            setSets(prevSets => prevSets.filter(set => set.set_id !== setId));
        }
    };

    return (
        <div className="dashboard-container w-full max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Hello, {user?.username || 'User'}!</h2>
            <h3 className="text-2xl font-semibold mb-4">Your Flashcard Sets</h3>
            
            {loading && <p className="info-message">Loading sets...</p>}
            {error && <p className="error-message">Error: {error}</p>}

            {!loading && sets.length === 0 && (
                <p className="info-message">You have no flashcard sets yet. Click '+ Create Set' to start!</p>
            )}

            <div className="sets-list grid grid-cols-1 md:grid-cols-2 gap-6">
                {sets.map((set) => (
                    <div key={set.set_id} className="set-card p-4 bg-surface rounded-lg shadow-md border border-border">
                        <h4 className="text-xl font-bold text-primary mb-1">{set.title}</h4>
                        
                        {/* NEW: Display the Description */}
                        {set.description && (
                            <p className="text-md text-secondary mb-3 italic">{set.description}</p>
                        )}
                        
                        <p className="text-sm mb-4">Cards: **{set.card_count}**</p>
                        
                        <div className="actions flex justify-between gap-2">
                            <button 
                                onClick={() => navigateToQuiz(set.set_id)} 
                                className="nav-button primary-button flex-1"
                            >
                                Start Quiz
                            </button>
                            <button 
                                onClick={() => navigateToEditor(set.set_id)} 
                                className="nav-button secondary-button"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(set.set_id)} 
                                className="nav-button bg-red-600 text-white"
                                style={{ backgroundColor: '#dc2626', color: 'white' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;