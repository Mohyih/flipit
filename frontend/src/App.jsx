import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';
import SetEditor from './components/SetEditor.jsx'; 
import Quiz from './components/Quiz.jsx';


const API_BASE_URL = 'https://a0144728-f261-4753-b656-6d92d67137fa-00-17396kpj4nv29.pike.replit.dev/api';
                    
                    

const App = () => {

    const [theme, setTheme] = useState(localStorage.getItem('flipit_theme') || 'light');
    const [token, setToken] = useState(localStorage.getItem('flipit_token') || null);
    const [user, setUser] = useState(null);
    const [view, setView] = useState(token ? 'dashboard' : 'auth'); 
    const [currentSetId, setCurrentSetId] = useState(null);
    const [currentSet, setCurrentSet] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.body.className = theme === 'dark' ? 'dark-mode' : '';
        localStorage.setItem('flipit_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

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

    const navigateToDashboard = () => {
        setCurrentSetId(null);
        setCurrentSet(null);
        setView('dashboard');
    };
    
    const navigateToCreateSet = () => {
        setCurrentSetId(null);
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

    return (
        <div className={`app ${theme}-mode`}> 
            <header className="app-header">
                <h1 
                    onClick={navigateToDashboard} 
                    className="logo-button"
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
                                <span className="material-symbols-outlined">
                                    {theme === 'light' ? '☾' : '☼'}
                                </span>
                            </button>

                            <button 
                                onClick={navigateToCreateSet} 
                                className="nav-button create-set-button"
                            >
                                + Create Set
                            </button>

                            <button onClick={handleLogout} className="nav-button logout-button">
                                Logout
                            </button>
                        </>
                    )}
                </nav>
            </header>
            <div className="container">
                {error && <div className="error-message" style={{ color: 'red', padding: '10px' }}>Error: {error}</div>}
                {renderContent()}
            </div>
        </div>
    );
};

export default App;
