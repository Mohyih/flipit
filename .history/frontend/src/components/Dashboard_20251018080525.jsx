// src/components/Dashboard.jsx (CORRECTED with modern cards and icons)

import React, { useState, useEffect } from 'react';

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, user }) => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    
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
            setSets(prevSets => prevSets.filter(set => set.set_id !== setId));
        } catch (e) {
            alert(`Failed to delete set: ${e.message}`);
        }
    };
    
    // Handler for clicking the card to start the quiz
    const handleStudySet = (setId) => {
        // Only navigate if the user didn't click one of the icons
        navigateToQuiz(setId);
    };

    const handleManageClick = (e, setId) => {
        // Stop event propagation so clicking the gear doesn't also start the quiz
        e.stopPropagation();
        navigateToEditor(setId);
    };

    const handleDeleteClick = (e, setId) => {
        // Stop event propagation so clicking the X doesn't also start the quiz
        e.stopPropagation();
        handleDeleteSet(setId);
    };

    if (loading) {
        return <div>Loading Dashboard...</div>;
    }

    return (
        <div className="dashboard">
            {/* Removed: "Welcome, Authenticated User!" and "Your Flashcard Sets" text */}
            
            {sets.length === 0 ? (
                <p>You haven't created any sets yet. Use the **+ Create Set** button in the header!</p>
            ) : (
                <div className="set-list">
                    {sets.map(set => (
                        // Clicking the main card area starts the quiz
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
                                    ⚙️ {/* Using a gear symbol for Manage */}
                                </span>
                            </button>

                            {/* Delete Icon (X) */}
                            <button 
                                onClick={(e) => handleDeleteClick(e, set.set_id)}
                                className="set-icon-button delete-set-btn"
                                title="Delete Set"
                            >
                                **&times;** {/* Using the times symbol for Delete */}
                            </button>

                            {/* Card Content */}
                            <h4>{set.title}</h4>
                            <p>{set.card_count} cards</p>
                            
                            {/* Removed: Study, Manage, Delete buttons */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;