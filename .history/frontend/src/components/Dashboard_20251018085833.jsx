// src/components/Dashboard.jsx (FINALIZED - Removed 'loading' state)

import React, { useState, useEffect } from 'react';

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, user }) => {
    const [sets, setSets] = useState([]);
    // Removed: const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchSets = async () => {
            try {
                const data = await apiCall('/sets');
                setSets(data);
            } catch (e) {
                console.error("Failed to fetch sets:", e);
            } 
            // Removed: finally { setLoading(false); }
        };
        fetchSets();
    }, [apiCall]);

    const handleDeleteSet = async (setId) => {
        if (!window.confirm("Are you sure you want to delete this set?")) return;
        try {
            await apiCall(`/sets/${setId}`, 'DELETE');
            setSets(prevSets => prevSets.filter(set => set.set_id !== setId));
        } catch (e) {
            alert(`Failed to delete set: ${e.message}`);
        }
    };
    
    // Handler for clicking the card to start the quiz
    const handleStudySet = (setId) => {
        navigateToQuiz(setId);
    };

    const handleManageClick = (e, setId) => {
        e.stopPropagation();
        navigateToEditor(setId);
    };

    const handleDeleteClick = (e, setId) => {
        e.stopPropagation();
        handleDeleteSet(setId);
    };

    // Removed: if (loading) { return <div>Loading Dashboard...</div>; }

    return (
        <div className="dashboard">
            
            {/* Conditional message now checks only if the list is empty */}
            {sets.length === 0 ? (
                <p>
                    {/* Display a quick message, which should only be visible briefly */}
                    {sets.length === 0 ? 
                        "You haven't created any sets yet. Use the **+ Create Set** button in the header!" 
                        : "Loading your Flashcard Sets..."}
                </p>
            ) : (
                <div className="set-list">
                    {sets.map(set => (
                        <div 
                            key={set.set_id} 
                            className="set-card"
                            onClick={() => handleStudySet(set.set_id)}
                        >
                            {/* Manage Icon (Gear) */}
                            <button 
                                onClick={(e) => handleManageClick(e, set.set_id)}
                                className="set-icon-button manage-set-btn"
                                title="Manage Set"
                            >
                                <span className="material-symbols-outlined">
                                    ⚙
                                </span>
                            </button>

                            {/* Delete Icon (X) - Using the HTML entity for the cross symbol */}
                            <button 
                                onClick={(e) => handleDeleteClick(e, set.set_id)}
                                className="set-icon-button delete-set-btn"
                                title="Delete Set"
                            >
                                x 
                            </button>

                            {/* Card Content */}
                            <h4>{set.title}</h4>
                            <p>{set.card_count} cards</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;