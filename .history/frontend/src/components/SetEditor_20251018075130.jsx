// src/components/SetEditor.jsx

import React, { useState } from 'react';

const SetEditor = ({ apiCall, set, refreshSet, navigateToDashboard }) => {
    // Local state for set title (if editing)
    const [title, setTitle] = useState(set.title || ''); 
    // Local state for new card input
    const [newFront, setNewFront] = useState('');
    const [newBack, setNewBack] = useState('');
    
    // Determine if we are creating a brand new set (set.set_id is null/undefined)
    const isNewSet = !set.set_id; 

    // --- Card Management Handlers ---

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
            await apiCall(`/sets/${set.set_id}/cards`, 'POST', {
                front: newFront,
                back: newBack
            });
            setNewFront('');
            setNewBack('');
            await refreshSet(); 
        } catch (e) {
            alert(`Failed to add card: ${e.message}`);
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!window.confirm("Are you sure you want to delete this card?")) return;
        try {
            await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'DELETE');
            await refreshSet();
        } catch (e) {
            alert(`Failed to delete card: ${e.message}`);
        }
    };
    
    // --- Set Title Management Handler ---

    const handleSaveTitle = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Set title cannot be empty.");
            return;
        }

        try {
            if (isNewSet) {
                // POST to create a new set
                const newSetData = await apiCall('/sets', 'POST', { title: title.trim() });
                // If successful, navigate to the editor view for the NEW set (which has an ID now)
                // This ensures isNewSet becomes false and the card editor appears
                // NOTE: navigateToEditor is not provided in your props, assuming it comes from App.jsx's logic
                // If navigateToEditor is not available, you would use:
                // navigateToDashboard(); 
                alert("Set saved! You can now add cards.");
                // For now, let's just refresh the state to show the card inputs (requires set state to be updated in App.jsx if you navigate away, but since you don't have navigateToEditor in props, we'll simplify and refresh locally if possible, or force dashboard view)
                navigateToDashboard(); 

            } else {
                // PUT to update existing set title
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

            {/* Set Title Form */}
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
                    {/* Centered Add Card Form (New Style) */}
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

                    {/* Card List Table */}
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
                                    <td>{card.front}</td>
                                    <td>{card.back}</td>
                                    <td>{card.streak}</td>
                                    <td>
                                        <button className="action-button edit-btn">Edit</button> 
                                        <button 
                                            onClick={() => handleDeleteCard(card.card_id)}
                                            className="action-button delete-btn"
                                        >
                                            Delete
                                        </button>
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