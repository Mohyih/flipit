// src/components/Auth.jsx
import React, { useState } from 'react';

const Auth = ({ apiCall, onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        const endpoint = isLogin ? '/login' : '/register';

        try {
            const data = await apiCall(endpoint, 'POST', { username, password });
            
            if (isLogin) {
                // The C++ server uses the user_id as the token
                onLogin(data.user_id); 
            } else {
                setMessage('Registration successful! Please log in.');
                setIsLogin(true);
            }
        } catch (error) {
          
        }
    };

    return (
        <div className="auth-form">
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">
                    {isLogin ? 'Log In' : 'Sign Up'}
                </button>
            </form>
            <p style={{marginTop: '15px'}}>
                <a href="#" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
                </a>
            </p>
 
            
        </div>
    );
};

export default Auth;