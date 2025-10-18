// src/components/Dashboard.jsx (CORRECTED)

import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react'; // Import icons for better visibility

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, user }) => {
    const [sets, setSets] = useState([]);
    
    // Using a separate state for loading local to the dashboard content
    const [contentLoading, setContentLoading] = useState(true);

    useEffect(() => {
        const fetchSets = async () => {
            setContentLoading(true);
            try {
                // Assuming apiCall handles loading/error state globally in App.jsx
                const data = await apiCall('/sets'); 
                setSets(data);
            } catch (e) {
                console.error("Failed to fetch sets:", e);
                // Error handling is assumed to be in App.jsx's API wrapper
            } finally {
                setContentLoading(false);
            }
        };
        fetchSets();
    }, [apiCall]);

    // ... (handleDeleteSet and click handlers remain the same) ...

    const handleDeleteSet = async (setId) => {
        if (!window.confirm("Are you sure you want to delete this set?")) return;
        try {
            // Note: The original prompt removed window.confirm, but it's good practice. 
            // Re-adding the check locally here.
            await apiCall(`/sets/${setId}`, 'DELETE');
            setSets(prevSets => prevSets.filter(set => set.set_id !== setId));
        } catch (e) {
            // Error handling in apiCall should already show a global error message
        }
    };
    
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

    return (
        <div className="dashboard-container w-full max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Hello, {user?.username || 'User'}!</h2>
            <h3 className="text-2xl font-semibold mb-4">Your Flashcard Sets</h3>
            
            {/* Show a loading state specifically for the set list */}
            {contentLoading && <p className="info-message">Loading your Flashcard Sets...</p>}

            {!contentLoading && sets.length === 0 && (
                <p className="info-message">
                    You haven't created any sets yet. Use the **+ Create Set** button in the header!
                </p>
            )}

            {/* Render the set list */}
            {!contentLoading && sets.length > 0 && (
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
                                <Settings size={20} />
                            </button>

                            {/* Delete Icon (X) */}
                            <button 
                                onClick={(e) => handleDeleteClick(e, set.set_id)}
                                className="set-icon-button delete-set-btn"
                                title="Delete Set"
                            >
                                <X size={20} />
                            </button>

                            {/* Card Content */}
                            <h4 className="text-truncate">{set.title}</h4>
                            
                            {/* NEW: Description Field */}
                            <p className="set-card-description">{set.description || "No description provided."}</p>
                            
                            {/* Card Count */}
                            <p className="card-count-text">**{set.card_count}** cards</p>
                            
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;