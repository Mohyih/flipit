// src/components/SetEditor.jsx
import React, { useState, useEffect } from 'react';

const SetEditor = ({ apiCall, set, refreshSet, navigateToDashboard }) => {
    const [newFront, setNewFront] = useState('');
    const [newBack, setNewBack] = useState('');
    const [isEditing, setIsEditing] = useState(null); // card_id of the card being edited
    const [editFront, setEditFront] = useState('');
    const [editBack, setEditBack] = useState('');

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!newFront.trim() || !newBack.trim()) return;

        try {
            await apiCall(`/sets/${set.set_id}/cards`, 'POST', { front: newFront, back: newBack });
            setNewFront('');
            setNewBack('');
            refreshSet();
        } catch (e) {
            // Error handled by parent App.jsx
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!window.confirm("Are you sure you want to delete this card?")) return;
        try {
            await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'DELETE');
            refreshSet();
        } catch (e) {
            // Error handled by parent App.jsx
        }
    };
    
    const handleStartEdit = (card) => {
        setIsEditing(card.card_id);
        setEditFront(card.front);
        setEditBack(card.back);
    };

    const handleSaveEdit = async (cardId) => {
        if (!editFront.trim() || !editBack.trim()) return;
        try {
            await apiCall(`/sets/${set.set_id}/cards/${cardId}`, 'PUT', { front: editFront, back: editBack });
            setIsEditing(null);
            refreshSet();
        } catch (e) {
            // Error handled by parent App.jsx
        }
    };

    return (
        <div>
            <button onClick={navigateToDashboard} style={{marginBottom: '20px', background: '#ccc', color: '#333'}}>
                &larr; Back to Dashboard
            </button>
            
            <h3>Editing: {set.title} ({set.cards.length} cards)</h3>

            {/* Form for adding a new card */}
            <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px', margin: '20px 0' }}>
                <input
                    type="text"
                    placeholder="Card Front (Question)"
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Card Back (Answer)"
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    required
                />
                <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', padding: '10px' }}>
                    Add New Card
                </button>
            </form>

            {/* Table for viewing and editing cards */}
            <table className="card-editor-table">
                <thead>
                    <tr>
                        <th style={{ width: '40%' }}>Front</th>
                        <th style={{ width: '40%' }}>Back</th>
                        <th style={{ width: '20%' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {set.cards.map((card) => (
                        <tr key={card.card_id}>
                            {isEditing === card.card_id ? (
                                <>
                                    <td><input value={editFront} onChange={(e) => setEditFront(e.target.value)} style={{ width: '95%' }} /></td>
                                    <td><input value={editBack} onChange={(e) => setEditBack(e.target.value)} style={{ width: '95%' }} /></td>
                                    <td>
                                        <button onClick={() => handleSaveEdit(card.card_id)} style={{ background: '#007bff', color: 'white' }}>Save</button>
                                        <button onClick={() => setIsEditing(null)} style={{ background: '#6c757d', color: 'white' }}>Cancel</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{card.front}</td>
                                    <td>{card.back}</td>
                                    <td>
                                        <button onClick={() => handleStartEdit(card)} style={{ background: '#ffc107', color: 'black' }}>Edit</button>
                                        <button onClick={() => handleDeleteCard(card.card_id)} style={{ background: '#dc3545', color: 'white' }}>Delete</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SetEditor;