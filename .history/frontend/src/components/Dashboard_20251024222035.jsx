import React, { useState, useEffect } from 'react';

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, user, sets, setSets }) => {
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false); // ✅ added flag

    useEffect(() => {
        const fetchSets = async () => {
            if (hasFetched || sets.length > 0) return; 
            setHasFetched(true);
            setLoading(true);
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
    }, [apiCall, sets, setSets, hasFetched]);

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
            {loading ? (
                <p>Loading your sets...</p>
            ) : sets.length === 0 ? (
                <p>
                    You haven't created any sets yet. Use the <b>+ Create Set</b> button in the header!
                </p>
            ) : (
                <div className="set-list">
                    {sets.map(set => (
                        <div
                            key={set.set_id}
                            className="set-card"
                            onClick={() => handleStudySet(set.set_id)}
                        >
                            <button
                                onClick={(e) => handleManageClick(e, set.set_id)}
                                className="set-icon-button manage-set-btn"
                                title="Manage Set"
                            >
                                <span className="material-symbols-outlined">⚙</span>
                            </button>

                            <button
                                onClick={(e) => handleDeleteClick(e, set.set_id)}
                                className="set-icon-button delete-set-btn"
                                title="Delete Set"
                            >
                                X
                            </button>

                            <h4>{set.title}</h4>
                            <p className="set-description">{set.description}</p>
                            <p>{set.card_count} cards</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
