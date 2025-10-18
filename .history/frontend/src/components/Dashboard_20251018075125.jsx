// src/components/Dashboard.jsx

import React, { useState, useEffect } from 'react';

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, user }) => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    // REMOVED: [newSetName, setNewSetName] state & handleCreateSet function
    
    // Initial fetch of sets
    useEffect(() => {
        const fetchSets = async () => {
            try {
                const data = await apiCall('/sets');
                setSets(data);
            } catch (e) {
                console.error("Failed to fetch sets:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSets();
    }, [apiCall]);

    const handleDeleteSet = async (setId) => {
        if (!window.confirm("Are you sure you want to delete this set?")) return;
        try {
            await apiCall(`/sets/${setId}`, 'DELETE');
            // Optimistically update the list
            setSets(prevSets => prevSets.filter(set => set.set_id !== setId));
        } catch (e) {
            alert(`Failed to delete set: ${e.message}`);
        }
    };

    if (loading) {
        return <div>Loading Dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <h2>Welcome, {user ? user.username : 'User'}!</h2>
            
            {/* The "Create Set" input/button block has been permanently moved to the App header */}
            
            <h3>Your Flashcard Sets ({sets.length})</h3>
            
            {sets.length === 0 ? (
                <p>You haven't created any sets yet. Use the **+ Create Set** button in the header!</p>
            ) : (
                <div className="set-list">
                    {sets.map(set => (
                        <div key={set.set_id} className="set-card">
                            <h4>{set.title}</h4>
                            <p>{set.card_count} cards</p>
                            
                            {/* Modern Buttons */}
                            <button 
                                onClick={() => navigateToQuiz(set.set_id)}
                                className="action-button quiz-btn"
                            >
                                Study
                            </button>
                            <button 
                                onClick={() => navigateToEditor(set.set_id)}
                                className="action-button edit-btn"
                            >
                                Manage
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.set_id); }}
                                className="action-button delete-btn"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;