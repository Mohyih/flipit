// src/components/SetEditor.jsx (MODIFIED - Added silent loading check)

import React, { useState } from 'react';

const SetEditor = ({ apiCall, set, refreshSet, navigateToDashboard }) => {
    // Check if the set object is available, otherwise, this component will crash trying to access set.title
    if (!set) {
        return null; // Return nothing until the parent provides the 'set' prop
    }

    const [title, setTitle] = useState(set.title || ''); 
    const [newFront, setNewFront] = useState('');
    const [newBack, setNewBack] = useState('');
    
    const [editingCardId, setEditingCardId] = useState(null); 
    const [editData, setEditData] = useState({ front: '', back: '' });

    const isNewSet = !set.set_id; 

    // --- Card Creation & Deletion Handlers (Unchanged) ---
    const handleCreateCard = async () => {
        if (!newFront || !newBack) {
            alert("Front and Back cannot be empty.");
            return;
        }
        if (isNewSet) {
             alert("Please save the set title first before adding cards!");
             return; 
        }
        try {
            await apiCall(`/sets/${set.set_id}/cards`, 'POST', { front: newFront, back: newBack });
            setNewFront('');
            setNewBack('');
            // When refreshing, the UI should stay put and update fast
            await refreshSet(); 
        } catch (e) {
            alert(`Failed to add card: ${e.message}`);
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!window.confirm("Are you sure you want to delete this card?")) return;
        try {
            await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'DELETE');
            // When refreshing, the UI should stay put and update fast
            await refreshSet();
        } catch (e) {
            alert(`Failed to delete card: ${e.message}`);
        }
    };
    
    // --- Card Editing Handlers (Unchanged) ---
    const handleEdit = (card) => {
        setEditingCardId(card.card_id);
        setEditData({ front: card.front, back: card.back });
    };

    const handleSaveEdit = async (cardId) => {
        if (!editData.front.trim() || !editData.back.trim()) {
            alert("Card content cannot be empty.");
            return;
        }
        try {
            await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'PUT', {
                front: editData.front.trim(), back: editData.back.trim()
            });
            setEditingCardId(null);
            // When refreshing, the UI should stay put and update fast
            await refreshSet(); 
        } catch (e) {
            alert(`Failed to update card: ${e.message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingCardId(null);
        setEditData({ front: '', back: '' });
    };

    // --- Set Title Management Handler (Unchanged) ---
    const handleSaveTitle = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Set title cannot be empty.");
            return;
        }
        try {
            if (isNewSet) {
                await apiCall('/sets', 'POST', { title: title.trim() });
                alert("Set saved! You can now add cards.");
                navigateToDashboard(); 
            } else {
                await apiCall(`/sets/${set.set_id}`, 'PUT', { title: title.trim() });
                await refreshSet();
                alert("Title updated successfully!");
            }
        } catch (e) {
            alert(`Failed to save set: ${e.message}`);
        }
    };

    return (
        <div className="set-editor">
            <h2 style={{ textAlign: 'center' }}>{isNewSet ? 'Create New Set' : `Editing: ${set.title}`}</h2>

            {/* Set Title Form (Unchanged) */}
            <form onSubmit={handleSaveTitle} style={{ textAlign: 'center', marginBottom: '30px' }}>
                <input
                    type="text"
                    placeholder="Set Title (e.g., 'Math Fundamentals')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ padding: '10px', width: '350px', marginRight: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <button type="submit" className="action-button edit-btn">
                    {isNewSet ? 'Save Set' : 'Update Title'}
                </button>
            </form>
            
            {/* Card Editor is ONLY available after the set has an ID */}
            {!isNewSet && (
                <>
                    {/* Centered Add Card Form (Unchanged) */}
                    <div className="add-card-form-container">
                        <h3>Add a New Card</h3>
                        <input
                            type="text"
                            placeholder="Front of Card (Question)"
                            value={newFront}
                            onChange={(e) => setNewFront(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Back of Card (Answer)"
                            value={newBack}
                            onChange={(e) => setNewBack(e.target.value)}
                        />
                        <button onClick={handleCreateCard} className="action-button quiz-btn">
                            Add Card to Set
                        </button>
                    </div>

                    {/* Card List Table (New Modern Look via CSS) */}
                    <h3>Cards in Set ({set.cards.length})</h3>
                    <table className="card-editor-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Front</th>
                                <th>Back</th>
                                <th>Streak</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {set.cards.map((card, index) => (
                                <tr key={card.card_id}>
                                    <td>{index + 1}</td>
                                    {/* Conditional rendering for Front */}
                                    <td>
                                        {editingCardId === card.card_id ? (
                                            <input
                                                type="text"
                                                value={editData.front}
                                                onChange={(e) => setEditData(prev => ({ ...prev, front: e.target.value }))}
                                            />
                                        ) : (
                                            card.front
                                        )}
                                    </td>
                                    {/* Conditional rendering for Back */}
                                    <td>
                                        {editingCardId === card.card_id ? (
                                            <input
                                                type="text"
                                                value={editData.back}
                                                onChange={(e) => setEditData(prev => ({ ...prev, back: e.target.value }))}
                                            />
                                        ) : (
                                            card.back
                                        )}
                                    </td>
                                    <td>{card.streak}</td>
                                    <td>
                                        {editingCardId === card.card_id ? (
                                            <>
                                                {/* SAVE Button */}
                                                <button 
                                                    onClick={() => handleSaveEdit(card.card_id)}
                                                    className="action-button quiz-btn" 
                                                >
                                                    Save
                                                </button>
                                                {/* CANCEL Button */}
                                                <button 
                                                    onClick={handleCancelEdit}
                                                    className="action-button" 
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* EDIT Button */}
                                                <button 
                                                    onClick={() => handleEdit(card)}
                                                    className="action-button edit-btn"
                                                >
                                                    Edit
                                                </button> 
                                                {/* DELETE Button (Unchanged) */}
                                                <button 
                                                    onClick={() => handleDeleteCard(card.card_id)}
                                                    className="action-button delete-btn"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            <button onClick={navigateToDashboard} className="nav-button" style={{ marginTop: '30px', background: '#ccc', color: '#333' }}>
                Back to Dashboard
            </button>
        </div>
    );
};

export default SetEditor;