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
    // New State for Theme: Starts by checking local storage, defaults to 'light'
    const [theme, setTheme] = useState(localStorage.getItem('flipit_theme') || 'light');
    
    // State management for routing and data
    const [token, setToken] = useState(localStorage.getItem('flipit_token') || null);
    const [user, setUser] = useState(null);
    const [view, setView] = useState(token ? 'dashboard' : 'auth'); // 'auth', 'dashboard', 'editor', 'quiz'
    const [currentSetId, setCurrentSetId] = useState(null);
    const [currentSet, setCurrentSet] = useState(null); // Full set data for the editor/quiz
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Effect to apply the theme class to the document body and save preference
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('flipit_theme', theme);
    }, [theme]);

    // Function to Toggle Theme
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // --- Utility Function to Handle API Requests (Unchanged) ---
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
                if (response.status === 401) handleLogout();
                throw new Error(data.error || 'API call failed');
            }

            return data;

        } catch (err) {
            setLoading(false);
            setError(err.message);
            console.error('API Error:', err);
            throw err;
        }
    };


    // --- Auth Handlers (Unchanged) ---
    useEffect(() => {
        if (token) {
            // Mock user data since there is no `fetchUser` logic
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
    
    const navigateToCreateSet = () => {
        setCurrentSetId(null);
        // UPDATED: Include description in the initial state for a new set
        setCurrentSet({ set_id: null, title: '', description: '', cards: [] }); 
        setView('editor');
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

    // --- Data Fetching/Manipulation Handlers (Unchanged) ---
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


    // --- Render Logic (The Router - Unchanged) ---
    const renderContent = () => {
        if (!token) {
            return <Auth apiCall={apiCall} onLogin={handleLogin} />;
        }
        
        // Show overlay only if not on dashboard
        if (loading && view !== 'dashboard') {
            return <div className="loading-overlay">Loading...</div>;
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
                if (currentSet) {
                    return <SetEditor 
                                apiCall={apiCall} 
                                set={currentSet} 
                                refreshSet={refreshCurrentSet}
                                navigateToDashboard={navigateToDashboard}
                            />;
                }
                return <div className="info-message">Preparing set editor...</div>; 
            case 'quiz':
                if (currentSet) {
                    return <Quiz 
                                apiCall={apiCall} 
                                set={currentSet}
                                navigateToDashboard={navigateToDashboard}
                            />;
                }
                return <div className="info-message">Preparing quiz...</div>; 
            default:
                return <div className="error-card">404: View not found.</div>;
        }
    };

    // --- Main Layout (UI Updated Here) ---
    return (
        <div className="app-container"> 
            <header className="app-header">
                <h1 
                    onClick={token ? navigateToDashboard : () => {}} 
                    className={`logo-button ${token ? 'clickable' : 'non-clickable'}`}
                >
                    FLIPIT!
                </h1>
                <nav className="header-controls"> 
                    {token && (
                        <>
                            <button 
                                onClick={toggleTheme} 
                                className="nav-button theme-toggle-button"
                                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                            >
                                {theme === 'light' ? '☾' : '☼'}
                            </button>

                            <button 
                                onClick={navigateToCreateSet} 
                                className="nav-button primary-button create-set-button"
                            >
                                + Create Set
                            </button>

                            <button onClick={handleLogout} className="nav-button secondary-button logout-button">
                                Logout
                            </button>
                        </>
                    )}
                </nav>
            </header>
            <main className="main-content">
                {error && view === 'auth' && <div className="error-message">Error: {error}</div>}
                {renderContent()}
            </main>
        </div>
    );
};

export default App;