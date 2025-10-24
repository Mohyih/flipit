import React, { useEffect, useState } from 'react';

const SetEditor = ({ apiCall, set, refreshSet, navigateToDashboard }) => {
  const [title, setTitle] = useState(set.title);
  const [description, setDescription] = useState(set.description);
  const [cards, setCards] = useState(set.cards || []);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    refreshSet();
  }, [refreshSet]);

  const handleUpdateSet = async () => {
    setLoading(true);
    try {
      await apiCall(`/sets/${set.set_id}`, 'PUT', {
        title,
        description,
        cards,
      });
      navigateToDashboard(); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    setLoading(true);
    try {
      const newCard = await apiCall(`/sets/${set.set_id}/cards`, 'POST', {
        question: 'New Question',
        answer: 'New Answer',
      });
      setCards(prev => [...prev, newCard]); 
      await refreshSet();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCard = async (cardId, updatedData) => {
    setLoading(true);
    try {
      await apiCall(`/cards/${cardId}`, 'PUT', updatedData);
      setCards(prev =>
        prev.map(card => (card.card_id === cardId ? { ...card, ...updatedData } : card))
      ); // ✅ Stay on editor
      await refreshSet();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async cardId => {
    setLoading(true);
    try {
      await apiCall(`/cards/${cardId}`, 'DELETE');
      setCards(prev => prev.filter(card => card.card_id !== cardId)); 
      await refreshSet();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="set-editor">
      <h2>Edit Set</h2>
      <div className="set-meta">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Set Title"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
        />
      </div>

      <div className="editor-actions">
        <button onClick={handleUpdateSet} disabled={loading}>
          Save & Return
        </button>
        <button onClick={handleAddCard} disabled={loading}>
          + Add Card
        </button>
      </div>

      <div className="card-list">
        {cards.map(card => (
          <div key={card.card_id} className="card-item">
            <input
              type="text"
              value={card.question}
              onChange={e => handleUpdateCard(card.card_id, { question: e.target.value })}
              placeholder="Question"
            />
            <input
              type="text"
              value={card.answer}
              onChange={e => handleUpdateCard(card.card_id, { answer: e.target.value })}
              placeholder="Answer"
            />
            <button
              onClick={() => handleDeleteCard(card.card_id)}
              disabled={loading}
              className="delete-card"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetEditor;
