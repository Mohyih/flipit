// src/components/Dashboard.jsx (UPDATED WITH DESCRIPTION)

import React, { useState, useEffect } from 'react';

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, user }) => {
    const [sets, setSets] = useState([]);

    useEffect(() => {
        const fetchSets = async () => {
            try {
                const data = await apiCall('/sets');
                setSets(data);
            } catch (e) {
                console.error("Failed to fetch sets:", e);
            } 
        };
        fetchSets();
    }, [apiCall]);

    const handleDeleteSet = async (setId) => {
        try {
            await apiCall(`/sets/${setId}`, 'DELETE');
            setSets(prevSets => prevSets.filter(set => set.set_id !== setId));
        } catch (e) {
            alert(`Failed to delete set: ${e.message}`);
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
        <div className="dashboard">
            {sets.length === 0 ? (
                <p>
                    You haven't created any sets yet. Use the **+ Create Set** button in the header!
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

                            {/* Delete Icon (X) */}
                            <button 
                                onClick={(e) => handleDeleteClick(e, set.set_id)}
                                className="set-icon-button delete-set-btn"
                                title="Delete Set"
                            >
                                X
                            </button>

                            {/* Card Content */}
                            <h4>{set.title}</h4>
                            {/* NEW: Display description if exists */}
                            {set.description && <p className="set-description">{set.description}</p>}
                            <p>{set.card_count} cards</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
