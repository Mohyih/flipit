import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SetEditor from './components/SetEditor';
import Quiz from './components/Quiz';

// --- CONFIGURATION ---
// Base URL for the C++ backend server running on port 8080
const API_BASE_URL = 'http://localhost:8080/api';
// ---------------------

const App = () => {
    // State management for routing and data
    const [token, setToken] = useState(localStorage.getItem('flipit_token') || null);
    const [user, setUser] = useState(null);
    const [view, setView] = useState('dashboard'); // 'auth', 'dashboard', 'editor', 'quiz'
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
                // Handle 4xx or 5xx errors from the C++ server
                throw new Error(data.error || 'API call failed');
            }

            return data;

        } catch (err) {
            setLoading(false);
            setError(err.message);
            console.error('API Error:', err);
            // If we get an auth error, clear the token
            if (err.message.includes('Authentication required')) {
                handleLogout();
            }
            throw err;
        }
    };

    // --- Auth Handlers ---

    useEffect(() => {
        // Simple check to set initial view
        if (token) {
            // In a real app, you'd validate the token here. We'll simulate success.
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

    const navigateToDashboard = () => {
        setCurrentSetId(null);
        setCurrentSet(null);
        setView('dashboard');
    };

    const navigateToEditor = async (setId) => {
        setCurrentSetId(setId);
        await fetchSetDetails(setId);
        setView('editor');
    };

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
            // Handle error, maybe navigate to dashboard
            return null;
        }
    };
    
    // Refresh the set after an edit, useful for SetEditor
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
                if (currentSetId && currentSet) {
                    return <SetEditor 
                                apiCall={apiCall} 
                                set={currentSet} 
                                refreshSet={refreshCurrentSet}
                                navigateToDashboard={navigateToDashboard}
                            />;
                }
                // Fallback if data is missing
                return <div>Loading set editor...</div>; 
            case 'quiz':
                if (currentSetId && currentSet) {
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

    // --- Main Layout ---
    return (
        <div className="app">
            <header className="app-header">
                <h1>FLIPIT!</h1>
                <nav>
                    {token && (
                        <>
                            <button onClick={navigateToDashboard}>Dashboard</button>
                            <button onClick={handleLogout} style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>Logout</button>
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