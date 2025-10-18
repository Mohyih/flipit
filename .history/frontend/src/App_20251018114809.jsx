import React, { useState, useEffect } from 'react';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';
import SetEditor from './components/SetEditor.jsx'; 
import Quiz from './components/Quiz.jsx';
import './App.css'; // Make sure this CSS import is here

// --- CONFIGURATION ---
// NOTE: For a real deployment, this would be the actual backend URL.
const API_BASE_URL = 'http://localhost:8080/api';
// ---------------------

const App = () => {
    // State for Theme: Starts by checking local storage, defaults to 'light'
    const [theme, setTheme] = useState(localStorage.getItem('flipit_theme') || 'light');
    
    // State management for routing and data
    const [token, setToken] = useState(localStorage.getItem('flipit_token') || null);
    // Mock user data for simplicity in the client-side, assuming the token grants access
    const [user, setUser] = useState(token ? { username: 'Authenticated User' } : null); 
    
    // Update initial view based on token presence
    const [view, setView] = useState(token ? 'dashboard' : 'auth'); // 'auth', 'dashboard', 'editor', 'quiz'
    
    const [currentSetId, setCurrentSetId] = useState(null);
    // Full set data for the editor/quiz, initialized to null or mock empty structure
    const [currentSet, setCurrentSet] = useState(null); 
    
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Effect to apply the theme class to the document body and save preference
    useEffect(() => {
        // We apply the class to the root element for better control over the application's theme
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('flipit_theme', theme);
    }, [theme]);

    // Function to Toggle Theme
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    // --- Utility Function to Handle API Requests ---
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        setLoading(true);
        setError(null);
        
        // Exponential backoff parameters
        const MAX_RETRIES = 3;
        const INITIAL_DELAY = 1000; // 1 second

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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
                    // Check for authentication failure specifically
                    if (response.status === 401 || data.error?.includes('Authentication required')) {
                        handleLogout();
                    }
                    throw new Error(data.error || `API call failed with status ${response.status}`);
                }

                return data;

            } catch (err) {
                if (attempt === MAX_RETRIES - 1) {
                    setLoading(false);
                    setError(err.message);
                    console.error('API Error:', err);
                    throw err; 
                }
                // Wait for exponential backoff before retrying
                const delay = INITIAL_DELAY * (2 ** attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };


    // --- Auth Handlers ---
    useEffect(() => {
        if (token) {
            // Re-fetch user data if needed, but for now we set mock data
            setUser({ username: 'Authenticated User' });
            setView('dashboard');
        } else {
            setView('auth');
        }
    }, [token]);

    const handleLogin = (newToken) => {
        setToken(newToken);
        localStorage.setItem('flipit_token', newToken);
        // Set user immediately after successful login
        setUser({ username: 'New User' }); 
        setView('dashboard');
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
        // Initialize an empty set structure for the editor
        setCurrentSet({ set_id: null, title: '', cards: [] }); 
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

    // --- Data Fetching/Manipulation Handlers ---
    const fetchSetDetails = async (setId) => {
        try {
            const data = await apiCall(`/sets/${setId}`);
            setCurrentSet(data);
            return data;
        } catch (e) {
            // Error handled by apiCall, just return null on failure
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

        // Display loading/error overlays while waiting for content
        if (loading && view !== 'dashboard') {
            return <div className="loading-overlay">Loading...</div>;
        }
        if (error && view !== 'dashboard') {
             // For non-dashboard views, show the error clearly
             return <div className="error-card">Error: {error}</div>;
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
                // Fallback for initial load if currentSet is still null
                return <div className="info-message">Preparing set editor...</div>; 
            case 'quiz':
                if (currentSet) {
                    return <Quiz 
                                apiCall={apiCall} 
                                set={currentSet}
                                navigateToDashboard={navigateToDashboard}
                            />;
                }
                 // Fallback for initial load if currentSet is still null
                return <div className="info-message">Preparing quiz...</div>; 
            default:
                return <div className="error-card">404: View not found.</div>;
        }
    };

    // --- Main Layout (UI) ---
    return (
        // The theme class is applied here to control the entire app's look
        // We use documentElement data-theme attribute instead of a class here
        <div className="app-container"> 
            <header className="app-header">
                {/* 1. LOGO is now the Dashboard link/button */}
                <h1 
                    onClick={token ? navigateToDashboard : () => {}} // Only navigate if authenticated
                    className={`logo-button ${token ? 'clickable' : 'non-clickable'}`}
                >
                    FLIPIT!
                </h1>
                <nav className="header-controls">
                    {token && (
                        <>
                            {/* Dark/Light Mode Toggle Button */}
                            <button 
                                onClick={toggleTheme} 
                                className="nav-button theme-toggle-button"
                                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                            >
                                {/* Using Lucide icons, assuming they are available or using plain text fallback */}
                                {theme === 'light' ? '☾' : '☼'} 
                            </button>

                            {/* Create Set Button */}
                            <button 
                                onClick={navigateToCreateSet} 
                                className="nav-button primary-button create-set-button"
                            >
                                + Create Set
                            </button>

                            {/* Logout Button */}
                            <button onClick={handleLogout} className="nav-button secondary-button logout-button">
                                Logout
                            </button>
                        </>
                    )}
                </nav>
            </header>
            <main className="main-content">
                 {/* Error and Loading are now handled primarily within renderContent, but keeping a simple global loading indicator is helpful */}
                 {loading && view === 'dashboard' && <div className="loading-indicator">Loading Dashboard...</div>}
                 {error && view === 'auth' && <div className="error-message">Error: {error}</div>}
                 
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
