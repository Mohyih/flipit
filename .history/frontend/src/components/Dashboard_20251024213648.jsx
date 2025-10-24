import React, { useEffect, useState } from "react";

const Dashboard = ({ API_BASE_URL, token, onCreateSet, onSelectSet }) => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSets = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSets(data);
    } catch (err) {
      console.error("Failed to fetch sets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h2>Your Sets</h2>

      {/* ✅ Always visible Create Set button */}
      <button className="create-set-button" onClick={onCreateSet}>
        + Create Set
      </button>

      {loading ? (
        <p>Loading your sets...</p>
      ) : sets.length === 0 ? (
        <p>You don’t have any sets yet. Click “Create Set” to start!</p>
      ) : (
        <div className="set-list">
          {sets.map((set) => (
            <div
              key={set.setId}
              className="set-card"
              onClick={() => onSelectSet(set)}
            >
              <h4>{set.title}</h4>
              <p className="set-description">{set.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
