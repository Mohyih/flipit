// src/App.jsx

import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';
import SetEditor from './components/SetEditor.jsx'; 
import Quiz from './components/Quiz.jsx';

// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:8080/api';
// ---------------------

const App = () => {
    // State management for routing and data
    const [token, setToken] = useState(localStorage.getItem('flipit_token') || null);
    const [user, setUser] = useState(null);
    // Update initial view based on token presence
    const [view, setView] = useState(token ? 'dashboard' : 'auth'); // 'auth', 'dashboard', 'editor', 'quiz'
    const [currentSetId, setCurrentSetId] = useState(null);
    const [currentSet, setCurrentSet] = useState(null); // Full set data for the editor/quiz
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- Utility Function to Handle API Requests ---
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        setLoading(true);
        setError(null);
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const config = {
                method,
                headers,
                body: body ? JSON.stringify(body) : null,
            };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();
            setLoading(false);

            if (!response.ok) {
                throw new Error(data.error || 'API call failed');
            }

            return data;

        } catch (err) {
            setLoading(false);
            setError(err.message);
            console.error('API Error:', err);
            if (err.message.includes('Authentication required')) {
                handleLogout();
            }
            throw err;
        }
    };

    // --- Auth Handlers ---
    useEffect(() => {
        if (token) {
            setUser({ username: 'Authenticated User' });
            setView('dashboard');
        } else {
            setView('auth');
        }
    }, [token]);

    const handleLogin = (newToken) => {
        setToken(newToken);
        localStorage.setItem('flipit_token', newToken);
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('flipit_token');
        setView('auth');
        setCurrentSetId(null);
        setCurrentSet(null);
    };

    // --- Navigation Handlers ---
    
    // Stays the same
    const navigateToDashboard = () => {
        setCurrentSetId(null);
        setCurrentSet(null);
        setView('dashboard');
    };
    
    // NEW: Function to navigate to SetEditor for a NEW set
    const navigateToCreateSet = () => {
        setCurrentSetId(null);
        setCurrentSet({ set_id: null, title: '', cards: [] }); // Start with empty set object
        setView('editor');
    };

    // Stays the same, but we will use the currentSet data now.
    const navigateToEditor = async (setId) => {
        setCurrentSetId(setId);
        await fetchSetDetails(setId);
        setView('editor');
    };

    // Stays the same, but we will use the currentSet data now.
    const navigateToQuiz = async (setId) => {
        setCurrentSetId(setId);
        await fetchSetDetails(setId);
        setView('quiz');
    };

    // --- Data Fetching/Manipulation Handlers ---
    const fetchSetDetails = async (setId) => {
        try {
            const data = await apiCall(`/sets/${setId}`);
            setCurrentSet(data);
            return data;
        } catch (e) {
            return null;
        }
    };
    
    const refreshCurrentSet = async () => {
        if (currentSetId) {
            await fetchSetDetails(currentSetId);
        }
    }


    // --- Render Logic (The Router) ---
    const renderContent = () => {
        if (!token) {
            return <Auth apiCall={apiCall} onLogin={handleLogin} />;
        }

        switch (view) {
            case 'dashboard':
                return <Dashboard 
                            apiCall={apiCall} 
                            navigateToEditor={navigateToEditor}
                            navigateToQuiz={navigateToQuiz}
                            user={user}
                        />;
            case 'editor':
                // Check for currentSet, which is either an empty object (new set) or full data (existing set)
                if (currentSet) {
                    return <SetEditor 
                                apiCall={apiCall} 
                                set={currentSet} 
                                refreshSet={refreshCurrentSet}
                                navigateToDashboard={navigateToDashboard}
                            />;
                }
                return <div>Loading set editor...</div>; 
            case 'quiz':
                if (currentSet) {
                    return <Quiz 
                                apiCall={apiCall} 
                                set={currentSet}
                                navigateToDashboard={navigateToDashboard}
                            />;
                }
                return <div>Loading quiz...</div>; 
            default:
                return <div>404: View not found.</div>;
        }
    };

    // --- Main Layout (UI Updated Here) ---
    return (
        <div className="app">
            <header className="app-header">
                <h1>FLIPIT!</h1> {/* Green logo text via CSS */}
                <nav>
                    {token && (
                        <>
                            {/* Dashboard Button */}
                            <button onClick={navigateToDashboard} className="nav-button">
                                Dashboard
                            </button>
                            
                            {/* Create Set Button (The new primary button) */}
                            <button 
                                onClick={navigateToCreateSet} 
                                className="nav-button create-set-button"
                            >
                                + Create Set
                            </button>

                            {/* Logout Button */}
                            <button onClick={handleLogout} className="nav-button">
                                Logout
                            </button>
                        </>
                    )}
                </nav>
            </header>
            <div className="container">
                {loading && <div className="loading-indicator" style={{ color: 'blue', padding: '10px' }}>Loading...</div>}
                {error && <div className="error-message" style={{ color: 'red', padding: '10px' }}>Error: {error}</div>}
                {renderContent()}
            </div>
        </div>
    );
};

export default App;