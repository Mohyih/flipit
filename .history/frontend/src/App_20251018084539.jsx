// src/App.jsx

import React, { useState, useEffect } from 'react';
import './App.css'; 

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SetEditor from './components/SetEditor';
import Quiz from './components/Quiz'; // Assuming you'll implement this soon

function App() {
    const [page, setPage] = useState('dashboard'); // 'dashboard', 'edit', 'create', 'quiz'
    const [token, setToken] = useState(localStorage.getItem('userToken')); 
    const [userId, setUserId] = useState(localStorage.getItem('userId')); 
    const [currentSetId, setCurrentSetId] = useState(null); 
    const [currentSet, setCurrentSet] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Authentication and Token Management ---
    const handleLogin = (userToken, uid) => {
        localStorage.setItem('userToken', userToken);
        localStorage.setItem('userId', uid);
        setToken(userToken);
        setUserId(uid);
        setPage('dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        setToken(null);
        setUserId(null);
        setPage('dashboard'); // Go to dashboard (which will redirect to auth)
    };

    // --- API Helper Function ---
    const apiCall = async (endpoint, method = 'GET', data = null) => {
        setLoading(true);
        setError(null);
        
        const url = `http://localhost:8080/api${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            // CRITICAL: Send the token with every authenticated request
            'Authorization': `Bearer ${token}` 
        };

        const config = {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        };

        try {
            const response = await fetch(url, config);
            const responseData = await response.json();
            
            if (!response.ok) {
                // If 403 (Unauthorized), automatically log out
                if (response.status === 403) {
                    handleLogout();
                    throw new Error("Session expired or unauthorized. Please log in again.");
                }
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }
            return responseData;

        } catch (e) {
            setError(e.message);
            throw e; // Re-throw the error for the component to catch
        } finally {
            setLoading(false);
        }
    };
    
    // --- Navigation Functions ---
    const navigateToDashboard = () => {
        setCurrentSetId(null);
        setCurrentSet(null);
        setPage('dashboard');
    };

    const navigateToCreateSet = () => {
        setCurrentSetId(null);
        // Pass a mock 'new' set object to the editor
        setCurrentSet({ title: "New Flashcard Set", cards: [] }); 
        setPage('edit');
    };

    const navigateToEditSet = (setId) => {
        setCurrentSetId(setId);
        setPage('edit');
    };

    const navigateToQuiz = (setId) => {
        setCurrentSetId(setId);
        setPage('quiz');
    };

    // --- Fetch Current Set data for Editor/Quiz ---
    useEffect(() => {
        if (currentSetId && (page === 'edit' || page === 'quiz') && token) {
            const fetchSet = async () => {
                try {
                    const data = await apiCall(`/sets/${currentSetId}`);
                    setCurrentSet(data);
                } catch (e) {
                    console.error("Failed to fetch set:", e);
                    setCurrentSet(null);
                    // If fetching fails, redirect to dashboard
                    navigateToDashboard();
                }
            };
            fetchSet();
        } else if (page === 'create') {
            // Already set a mock set object in navigateToCreateSet
        }
    }, [currentSetId, page, token]); // Re-fetch when ID, page, or token changes

    // --- Render Logic ---
    let content;

    if (!token) {
        content = <Auth apiCall={apiCall} handleLogin={handleLogin} />;
    } else {
        switch (page) {
            case 'edit':
                content = <SetEditor 
                    apiCall={apiCall} 
                    set={currentSet} 
                    refreshSet={() => setCurrentSetId(currentSetId)} // Trigger re-fetch
                    navigateToDashboard={navigateToDashboard}
                />;
                break;
            case 'quiz':
                content = <Quiz 
                    apiCall={apiCall} 
                    set={currentSet} 
                    navigateToDashboard={navigateToDashboard}
                />;
                break;
            case 'dashboard':
            default:
                content = <Dashboard 
                    apiCall={apiCall} 
                    userId={userId} 
                    navigateToEditSet={navigateToEditSet}
                    navigateToQuiz={navigateToQuiz}
                    navigateToCreateSet={navigateToCreateSet}
                />;
                break;
        }
    }

    return (
        <div className="App">
            <header className="app-header">
                {/* 1. LOGO is now the Dashboard link */}
                <h1 className="logo" onClick={navigateToDashboard} style={{ cursor: 'pointer' }}>
                    FLIPIT!
                </h1>

                <nav className="nav-bar">
                    {token && (
                        <>
                            {/* 2. Remove redundant Dashboard link */}
                            
                            <button className="nav-button create-set-btn" onClick={navigateToCreateSet}>
                                + Create Set
                            </button>
                            
                            {/* 3. LOGOUT is now a dedicated button */}
                            <button className="nav-button logout-btn" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    )}
                </nav>
            </header>

            <main className="main-content">
                {loading && <div className="loading-message">Loading...</div>}
                {error && <div className="error-message">{error}</div>}
                {!loading && content}
            </main>
        </div>
    );
}

export default App;