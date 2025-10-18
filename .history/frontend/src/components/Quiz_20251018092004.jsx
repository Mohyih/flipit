/* src/App.css (FINALIZED MODERN STYLES) */

/* ---------------------------------------------------- */
/* 1. CSS RESET & GLOBAL VARIABLES */
/* ---------------------------------------------------- */

/* Global Box Model Reset */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Define global variables used throughout the application */
:root {
  /* Application Color Palette */
  --color-header-bg: #1f2937;       /* Dark Charcoal/Navy for header */
  --color-primary-green: #059669;   /* Vibrant Green for action */
  --color-text-light: #f3f4f6;      /* Light text on dark */
  --color-text-dark: #111827;       /* Dark text on light */
  --color-background-light: #f9fafb;/* Page background */

  /* Typography */
  --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

body {
  font-family: var(--font-family);
  background-color: var(--color-background-light);
  color: var(--color-text-dark);
  line-height: 1.6; 
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ---------------------------------------------------- */
/* 2. HEADER & NAVIGATION STYLES */
/* ---------------------------------------------------- */

.app-header {
    background-color: var(--color-header-bg);
    padding: 15px 30px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.app-header h1 {
    font-size: 2em;
    font-weight: 800;
    color: var(--color-primary-green);
    letter-spacing: 2px;
    margin: 0; 
}

.logo-button { cursor: pointer; transition: opacity 0.2s ease; }
.logo-button:hover { opacity: 0.85; }

.nav-button {
    background: transparent;
    color: var(--color-text-light); 
    border: none;
    padding: 8px 15px;
    margin-left: 10px;
    cursor: pointer;
    font-weight: 500;
    border-radius: 8px;
    transition: background-color 0.2s ease;
}

.nav-button:hover { background: rgba(255, 255, 255, 0.15); }

.create-set-button {
    background-color: var(--color-primary-green);
    color: var(--color-header-bg); 
    font-weight: 700;
    border-radius: 25px; 
    padding: 10px 20px;
    transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.create-set-button:hover {
    background-color: #00A647; 
    transform: translateY(-2px); 
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.25);
}

.logout-button {
    background-color: #e74c3c; 
    color: white;
    font-weight: 700;
    border-radius: 25px; 
    padding: 10px 20px;
    margin-left: 20px; 
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.logout-button:hover {
    background-color: #c0392b; 
    transform: translateY(-2px); 
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.25);
}

/* ---------------------------------------------------- */
/* 3. FLIP CARD & QUIZ STYLES */
/* ---------------------------------------------------- */

.flip-card-container {
    perspective: 1000px;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative; 
    z-index: 5;
}

.flip-card {
    background-color: transparent;
    width: 450px; 
    height: 280px;
    position: relative;
    transition: transform 0.8s; 
    transform-style: preserve-3d;
    box-shadow: 0 10px 20px rgba(0,0,0,0.15); 
    border-radius: 12px;
}

.flip-card.flipped { transform: rotateY(180deg); }

.card-face {
    position: absolute;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden; 
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    padding: 20px;
    text-align: center;
    border-radius: 12px;
    font-weight: 500;
}

.card-front {
    background-color: white;
    color: var(--color-text-dark);
    border: 3px solid var(--color-primary-green); 
}

.card-back {
    background-color: var(--color-primary-green);
    color: var(--color-header-bg); 
    transform: rotateY(180deg);
}

/* Quiz Button Container */
.quiz-button-container {
    display: flex;
    justify-content: center;
    gap: 25px;
    margin-top: 30px;
}

.quiz-button-container button {
    padding: 12px 25px;
    font-weight: 700;
    border-radius: 25px;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    transition: background-color 0.2s ease, transform 0.1s ease;
    min-width: 150px;
}

.quiz-button-container .correct-btn {
    background-color: #28a745; 
    color: #fff;
}

.quiz-button-container .incorrect-btn {
    background-color: #dc3545; 
    color: #fff;
}

.quiz-button-container .correct-btn:hover { background-color: #1e7e34; }
.quiz-button-container .incorrect-btn:hover { background-color: #bd2130; }

/* Modern quiz status card */
.quiz-status-card {
    display: inline-block;
    background: #f3f4f6;
    color: #111827;
    font-weight: 600;
    padding: 12px 25px;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    margin: 20px 0;
    font-size: 1rem;
}

/* General Quiz container */
.quiz-container {
    text-align: center;
    padding: 20px;
}

/* End of quiz container */
.quiz-end-container {
    text-align: center;
    padding: 40px;
}

.quiz-end-stats {
    background: #e5f4ff;
    display: inline-block;
    padding: 20px 30px;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    font-weight: 600;
    color: #111827;
}

/* Exit quiz button styled like main quiz buttons */
.quiz-button.nav-btn {
    background-color: var(--color-primary-green);
    color: var(--color-header-bg);
    padding: 12px 25px;
    border-radius: 25px;
    font-weight: 700;
    margin-top: 20px;
    min-width: 150px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
    transition: background-color 0.2s ease, transform 0.1s ease;
}

.quiz-button.nav-btn:hover {
    background-color: #00A647;
    transform: translateY(-2px);
}

/* ---------------------------------------------------- */
/* 4. DASHBOARD & SET STYLES */
/* ---------------------------------------------------- */

.set-list {
    display: flex;
    flex-wrap: wrap;
    gap: 25px; 
    margin-top: 20px;
}
.set-card {
    background: white;
    padding: 20px;
    border-radius: 12px; 
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    width: 250px; 
    height: 140px; 
    cursor: pointer; 
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative; 
    overflow: hidden;
}
.set-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.2); }
.set-card h4 { margin: 0 0 5px 0; font-size: 1.25em; color: var(--color-text-dark); }
.set-card p { font-size: 0.9em; color: #6c757d; }

/* Icon buttons for dashboard */
.set-icon-button { position: absolute; top: 10px; background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 5px; border-radius: 50%; line-height: 1; z-index: 20; }
.manage-set-btn { right: 25px; color: #6c757d; }
.manage-set-btn:hover { color: var(--color-primary-green); background-color: rgba(0, 192, 92, 0.1); }
.delete-set-btn { right: 5px; color: #dc3545; font-weight: bold; }
.delete-set-btn:hover { color: white; background-color: #dc3545; }
