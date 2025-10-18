import React, { useState } from 'react';

const SetEditor = ({ apiCall, set, refreshSet, navigateToDashboard }) => {
    if (!set) return null; // Wait until set prop is provided

    const [title, setTitle] = useState(set.title || '');
    const [description, setDescription] = useState(set.description || '');
    const [newFront, setNewFront] = useState('');
    const [newBack, setNewBack] = useState('');
    const [editingCardId, setEditingCardId] = useState(null);
    const [editData, setEditData] = useState({ front: '', back: '' });

    const isNewSet = !set.set_id;

    // --- Card Creation & Deletion Handlers ---
    const handleCreateCard = async () => {
        if (!newFront || !newBack) {
            console.error("Front and Back cannot be empty.");
            return;
        }
        if (isNewSet) {
            console.error("Please save the set title first before adding cards!");
            return; 
        }
        try {
            await apiCall(`/sets/${set.set_id}/cards`, 'POST', { front: newFront, back: newBack });
            setNewFront('');
            setNewBack('');
            await refreshSet();
        } catch (e) {
            console.error(`Failed to add card: ${e.message}`);
        }
    };

    const handleDeleteCard = async (cardId) => {
        try {
            await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'DELETE');
            await refreshSet();
        } catch (e) {
            console.error(`Failed to delete card: ${e.message}`);
        }
    };

    // --- Card Editing Handlers ---
    const handleEdit = (card) => {
        setEditingCardId(card.card_id);
        setEditData({ front: card.front, back: card.back });
    };

    const handleSaveEdit = async (cardId) => {
        if (!editData.front.trim() || !editData.back.trim()) {
            console.error("Card content cannot be empty.");
            return;
        }
        try {
            await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'PUT', {
                front: editData.front.trim(),
                back: editData.back.trim()
            });
            setEditingCardId(null);
            await refreshSet();
        } catch (e) {
            console.error(`Failed to update card: ${e.message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingCardId(null);
        setEditData({ front: '', back: '' });
    };

    // --- Set Title & Description Handler ---
    const handleSaveTitle = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            console.error("Set title cannot be empty.");
            return;
        }
        try {
            if (isNewSet) {
                await apiCall('/sets', 'POST', { title: title.trim(), description: description.trim() });
                console.log("Set saved! You can now add cards.");
                navigateToDashboard(); 
            } else {
                await apiCall(`/sets/${set.set_id}`, 'PUT', { title: title.trim(), description: description.trim() });
                await refreshSet();
                console.log("Title and description updated successfully!");
            }
        } catch (e) {
            console.error(`Failed to save set: ${e.message}`);
        }
    };

    return (
        <div className="set-editor">
            <h2 className="editor-title" style={{ textAlign: 'center' }}>
                {isNewSet ? 'Create New Set' : `Editing: ${set.title}`}
            </h2>

            {/* Set Title & Description Form */}
            <form onSubmit={handleSaveTitle} style={{ textAlign: 'center', marginBottom: '30px' }}>
                <input
                    type="text"
                    placeholder="Set Title (e.g., 'Math Fundamentals')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ padding: '10px', width: '350px', marginRight: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <input
                    type="text"
                    placeholder="Set Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ padding: '10px', width: '350px', marginRight: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '10px' }}
                />
                <button type="submit" className="action-button primary-editor-button">
                    {isNewSet ? 'Save Set' : 'Update Title'}
                </button>
            </form>

            {/* Card Editor */}
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
                                        ) : card.front}
                                    </td>
                                    <td>
                                        {editingCardId === card.card_id ? (
                                            <input
                                                type="text"
                                                value={editData.back}
                                                onChange={(e) => setEditData(prev => ({ ...prev, back: e.target.value }))}
                                            />
                                        ) : card.back}
                                    </td>
                                    <td>
                                        {editingCardId === card.card_id ? (
                                            <>
                                                <button onClick={() => handleSaveEdit(card.card_id)} className="action-button quiz-btn">Save</button>
                                                <button onClick={handleCancelEdit} className="action-button">Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleEdit(card)} className="card-action-icon gear-icon" title="Edit Card">&#x2699;</button>
                                                <button onClick={() => handleDeleteCard(card.card_id)} className="card-action-icon delete-icon" title="Delete Card">&times;</button>
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
