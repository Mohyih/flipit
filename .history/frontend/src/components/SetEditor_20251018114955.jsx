import React, { useState, useEffect } from 'react';

const SetEditor = ({ apiCall, set, refreshSet, navigateToDashboard }) => {
    // UPDATED: Include description in state
    const [title, setTitle] = useState(set.title);
    const [description, setDescription] = useState(set.description || ''); // Initialize with existing or empty string
    const [cards, setCards] = useState(set.cards);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        setTitle(set.title);
        // UPDATED: Ensure description is correctly set on load
        setDescription(set.description || ''); 
        // Ensure there is at least one card field for new sets
        setCards(set.cards.length > 0 ? set.cards : [{ term: '', definition: '', id: crypto.randomUUID() }]);
    }, [set]);

    const handleCardChange = (index, field, value) => {
        const newCards = [...cards];
        newCards[index][field] = value;
        setCards(newCards);
    };

    const addCard = () => {
        // Use a unique ID generator for local card management
        setCards([...cards, { term: '', definition: '', id: crypto.randomUUID() }]);
    };

    const removeCard = (index) => {
        setCards(cards.filter((_, i) => i !== index));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        // Basic validation
        if (!title.trim()) {
            setMessage('Set title cannot be empty.');
            setSaving(false);
            return;
        }

        const cleanedCards = cards.filter(card => card.term.trim() || card.definition.trim());
        if (cleanedCards.length === 0) {
            setMessage('Please add at least one card.');
            setSaving(false);
            return;
        }

        // UPDATED: Include description in the payload
        const dataToSave = {
            set_id: set.set_id,
            title: title.trim(),
            description: description.trim(), // Include the new field
            cards: cleanedCards.map(({ term, definition }) => ({ term: term.trim(), definition: definition.trim() })),
        };
        
        try {
            const method = set.set_id ? 'PUT' : 'POST';
            const endpoint = set.set_id ? `/sets/${set.set_id}` : '/sets';
            
            // In a real app: const response = await apiCall(endpoint, method, dataToSave);
            // Mock API call (remove in real app)
            await new Promise(resolve => setTimeout(resolve, 800));
            const mockResponse = { message: 'Set saved successfully!', set_id: set.set_id || 99 };
            // End Mock

            setMessage(mockResponse.message);
            
            if (!set.set_id) {
                 // For a new set, navigate back to dashboard after a delay
                 setTimeout(() => navigateToDashboard(), 1500);
            } else {
                 // For existing set, just refresh the data
                 refreshSet();
            }

        } catch (error) {
            setMessage('Save failed: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="set-editor-container w-full max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">{set.set_id ? 'Edit Set' : 'Create New Set'}</h2>
            <form onSubmit={handleSave}>
                <div className="mb-6 p-4 bg-surface rounded-lg shadow-md border border-border">
                    <label className="block text-xl font-bold mb-2" htmlFor="title">Set Title</label>
                    <input
                        type="text"
                        id="title"
                        className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-xl"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., 'Spanish Vocabulary, Unit 1'"
                        required
                    />

                    {/* NEW DESCRIPTION INPUT FIELD */}
                    <label className="block text-xl font-bold mt-4 mb-2" htmlFor="description">Description (Optional)</label>
                    <textarea
                        id="description"
                        className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-y h-20"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Briefly describe what this set covers."
                    />
                </div>

                <div className="card-list space-y-4 mb-6">
                    <h3 className="text-2xl font-semibold mb-4">Cards ({cards.filter(c => c.term || c.definition).length} active)</h3>
                    {cards.map((card, index) => (
                        <div key={card.id || index} className="card-editor p-4 bg-surface rounded-lg shadow-sm border border-border flex flex-col md:flex-row gap-4">
                            {/* ... Card Term/Definition Inputs (No change needed here) ... */}
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Term</label>
                                <textarea
                                    className="w-full p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none h-20"
                                    value={card.term}
                                    onChange={(e) => handleCardChange(index, 'term', e.target.value)}
                                    placeholder="e.g., 'El perro'"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Definition</label>
                                <textarea
                                    className="w-full p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none h-20"
                                    value={card.definition}
                                    onChange={(e) => handleCardChange(index, 'definition', e.target.value)}
                                    placeholder="e.g., 'The dog'"
                                    required
                                />
                            </div>
                            <div className="flex justify-center items-center md:items-end">
                                <button
                                    type="button"
                                    onClick={() => removeCard(index)}
                                    className="nav-button bg-red-600 text-white p-2 h-10 w-10 flex items-center justify-center"
                                    title="Remove Card"
                                    style={{ backgroundColor: '#dc2626', color: 'white', minWidth: '40px' }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mb-6">
                    <button type="button" onClick={addCard} className="nav-button secondary-button">+ Add Card</button>
                    <div className="flex gap-4">
                        <button type="button" onClick={navigateToDashboard} className="nav-button secondary-button">Cancel</button>
                        <button type="submit" className="nav-button primary-button" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Set'}
                        </button>
                    </div>
                </div>
            </form>
            {message && <p className={`mt-4 text-center ${message.includes('saved successfully') ? 'info-message' : 'error-message'}`}>{message}</p>}
        </div>
    );
};

export default SetEditor;