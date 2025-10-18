// src/components/SetEditor.jsx (With Description Field)

import React, { useState } from 'react';

const SetEditor = ({ apiCall, set, refreshSet, navigateToDashboard }) => {
    // Check if the set object is available, otherwise, this component will crash trying to access set.title
    if (!set) {
        return null; // Return nothing until the parent provides the 'set' prop
    }

    const [title, setTitle] = useState(set.title || ''); 
    // 🛑 NEW STATE: For Set Description
    const [description, setDescription] = useState(set.description || ''); 
    
    const [newFront, setNewFront] = useState('');
    const [newBack, setNewBack] = useState('');
    
    const [editingCardId, setEditingCardId] = useState(null); 
    const [editData, setEditData] = useState({ front: '', back: '' });

    const isNewSet = !set.set_id; 

    // --- Card Creation & Deletion Handlers (Unchanged) ---
    const handleCreateCard = async () => {
        if (!newFront || !newBack) {
            // Replaced alert with console message as per instructions
            console.error("Front and Back cannot be empty.");
            return;
        }
        if (isNewSet) {
             // Replaced alert with console message as per instructions
             console.error("Please save the set title first before adding cards!");
             return; 
        }
        try {
            await apiCall(`/sets/${set.set_id}/cards`, 'POST', { front: newFront, back: newBack });
            setNewFront('');
            setNewBack('');
            await refreshSet(); 
        } catch (e) {
             // Replaced alert with console message as per instructions
            console.error(`Failed to add card: ${e.message}`);
        }
    };

   const handleDeleteCard = async (cardId) => {
    // 🛑 REMOVED: window.confirm() for instant deletion.
    try {
        await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'DELETE');
        await refreshSet();
    } catch (e) {
        console.error(`Failed to delete card: ${e.message}`);
    }
};
    // --- Card Editing Handlers (Unchanged) ---
    const handleEdit = (card) => {
        setEditingCardId(card.card_id);
        setEditData({ front: card.front, back: card.back });
    };

    const handleSaveEdit = async (cardId) => {
        if (!editData.front.trim() || !editData.back.trim()) {
             // Replaced alert with console message as per instructions
            console.error("Card content cannot be empty.");
            return;
        }
        try {
            await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'PUT', {
                front: editData.front.trim(), back: editData.back.trim()
            });
            setEditingCardId(null);
            await refreshSet(); 
        } catch (e) {
             // Replaced alert with console message as per instructions
            console.error(`Failed to update card: ${e.message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingCardId(null);
        setEditData({ front: '', back: '' });
    };

    // --- Set Title & Description Management Handler (UPDATED) ---
    const handleSaveTitle = async (e) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim(); // Get trimmed description

        if (!trimmedTitle) {
             // Replaced alert with console message as per instructions
            console.error("Set title cannot be empty.");
            return;
        }
        
        // Data payload includes both title and description
        const payload = { 
            title: trimmedTitle, 
            description: trimmedDescription // Send the description
        };

        try {
            if (isNewSet) {
                // For a new set, send the title and description
                await apiCall('/sets', 'POST', payload);
                 // Replaced alert with console message as per instructions
                console.log("Set saved! You can now add cards.");
                navigateToDashboard(); 
            } else {
                // For an existing set, update the title and description
                await apiCall(`/sets/${set.set_id}`, 'PUT', payload);
                await refreshSet();
                 // Replaced alert with console message as per instructions
                console.log("Set details updated successfully!");
            }
        } catch (e) {
             // Replaced alert with console message as per instructions
            console.error(`Failed to save set: ${e.message}`);
        }
    };

    return (
        <div className="set-editor">

            <h2 className="editor-title" style={{ textAlign: 'center' }}>
                {isNewSet ? 'Create New Set' : `Editing: ${set.title}`}
            </h2>


            <form onSubmit={handleSaveTitle} style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Set Title (e.g., 'Math Fundamentals')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ padding: '10px', width: '450px', maxWidth: '90%', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />

                <textarea
                    placeholder="Set Description (e.g., 'Key terms and formulas for the midterm exam.')"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    maxLength="200"
                    style={{ 
                        padding: '10px', 
                        width: '450px', 
                        maxWidth: '90%', 
                        marginBottom: '15px', 
                        borderRadius: '6px', 
                        border: '1px solid #ccc',
                        resize: 'vertical' 
                    }}
                />

                <button type="submit" className="action-button primary-editor-button">
                    {isNewSet ? 'Save Set' : 'Update Details'}
                </button>
            </form>
            
            {!isNewSet && (
                <>

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

                        <button onClick={handleCreateCard} className="action-button primary-editor-button">
                            Add Card to Set
                        </button>
                    </div>

                    <h3>Cards in Set ({set.cards.length})</h3>
                    <table className="card-editor-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Front</th>
                                <th>Back</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {set.cards.map((card, index) => (
                                <tr key={card.card_id}>
                                    <td>{index + 1}</td>

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
                                    <td>
                                        {editingCardId === card.card_id ? (
                                            <>

                                                <button 
                                                    onClick={() => handleSaveEdit(card.card_id)}
                                                    className="action-button quiz-btn" 
                                                >
                                                    Save
                                                </button>

                                                <button 
                                                    onClick={handleCancelEdit}
                                                    className="action-button" 
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>

                                                <button 
                                                    onClick={() => handleEdit(card)}
                                                    className="card-action-icon gear-icon"
                                                    title="Edit Card"
                                                >
                                                    <span className="material-symbols-outlined">⚙</span>
                                                </button> 

                                                <button 
                                                    onClick={() => handleDeleteCard(card.card_id)}
                                                    className="card-action-icon delete-icon"
                                                    title="Delete Card"
                                                >
                                                    <span className="material-symbols-outlined">X</span>
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
        </div>
    );
};

export default SetEditor;