// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, user }) => {
    const [sets, setSets] = useState([]);
    const [newSetTitle, setNewSetTitle] = useState('');

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            const data = await apiCall('/sets');
            setSets(data);
        } catch (e) {
            // Error handled by parent App.jsx
        }
    };

    const handleCreateSet = async (e) => {
        e.preventDefault();
        if (!newSetTitle.trim()) return;
        try {
            await apiCall('/sets', 'POST', { title: newSetTitle });
            setNewSetTitle('');
            fetchSets(); // Refresh the list
        } catch (e) {
            // Error handled by parent App.jsx
        }
    };

    const handleDeleteSet = async (setId) => {
        if (!window.confirm("Are you sure you want to delete this entire set?")) return;
        try {
            await apiCall(`/sets/${setId}`, 'DELETE');
            fetchSets(); // Refresh the list
        } catch (e) {
            // Error handled by parent App.jsx
        }
    };

    return (
        <div>
            <h2>Welcome, {user?.username || 'User'}!</h2>

            <form onSubmit={handleCreateSet} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <input
                    type="text"
                    placeholder="New Flashcard Set Title"
                    value={newSetTitle}
                    onChange={(e) => setNewSetTitle(e.target.value)}
                    required
                    style={{ flexGrow: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Create Set
                </button>
            </form>

            <h3>Your Flashcard Sets ({sets.length})</h3>
            
            <div className="set-list">
                {sets.map((set) => (
                    <div key={set.set_id} className="set-card">
                        <h4 onClick={() => navigateToEditor(set.set_id)} style={{ cursor: 'pointer', color: '#333' }}>
                            {set.title}
                        </h4>
                        <p style={{ fontSize: '0.9em', color: '#555' }}>Cards: {set.card_count}</p>
                        <button 
                            onClick={() => navigateToQuiz(set.set_id)}
                            style={{ background: '#4CAF50', color: 'white', marginRight: '5px' }}
                        >
                            Start Quiz
                        </button>
                        <button 
                            onClick={() => handleDeleteSet(set.set_id)}
                            style={{ background: '#dc3545', color: 'white' }}
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
            {sets.length === 0 && <p>You have no sets. Create one above!</p>}
        </div>
    );
};

export default Dashboard;