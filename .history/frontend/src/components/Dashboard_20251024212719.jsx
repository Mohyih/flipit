import React, { useEffect } from 'react';

const Dashboard = ({ apiCall, navigateToEditor, navigateToQuiz, navigateToCreateSet, sets, setSets }) => {
  useEffect(() => {
    if (sets.length === 0) {
      (async () => {
        try {
          const data = await apiCall('/sets');
          setSets(data);
        } catch (err) {
          console.error('Failed to load sets:', err);
        }
      })();
    }
  }, [sets, apiCall, setSets]);

  return (
    <div className="dashboard-container">
      <h2>Your Flashcard Sets</h2>
      <button className="create-set-button" onClick={navigateToCreateSet}>
        + Create New Set
      </button>

      <div className="set-list">
        {sets.length > 0 ? (
          sets.map(set => (
            <div key={set.set_id} className="set-card">
              <h3>{set.title}</h3>
              <div className="set-card-buttons">
                <button onClick={() => navigateToQuiz(set.set_id)}>Quiz</button>
                <button onClick={() => navigateToEditor(set.set_id)}>Edit</button>
              </div>
            </div>
          ))
        ) : (
          <p>No sets found. Click “Create New Set” to get started!</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
