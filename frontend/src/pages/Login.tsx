import React, { useState } from 'react';
import axios from 'axios';

interface LoginProps {
    onLoginSuccess: () => void;
    onRegisterClick: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onRegisterClick }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://15.206.73.143/api/login', { username, password });

            localStorage.setItem('token', res.data.token);
            onLoginSuccess();
        } catch (err: any) {
            alert('Login failed: ' + (err?.response?.data?.message || 'Unknown error'));
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <h2 style={styles.title}>Login</h2>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />

                <button onClick={handleLogin} style={styles.button}>
                    Login
                </button>

                <p style={styles.text}>
                    Don't have an account?{' '}
                    <span onClick={onRegisterClick} style={styles.linkButton}>
                        Register
                    </span>
                </p>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    wrapper: {
        height: '100vh',
        width: '100vw',
        backgroundColor: '#121212',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#1f1f1f',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0px 4px 20px rgba(0,0,0,0.5)',
        textAlign: 'center',
        width: '320px',
    },
    title: {
        color: '#ffffff',
        marginBottom: '20px',
    },
    input: {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        borderRadius: '5px',
        border: '1px solid #444',
        backgroundColor: '#2c2c2c',
        color: '#fff',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginBottom: '15px',
    },
    text: {
        color: '#aaa',
    },
    linkButton: {
        color: '#28a745',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};

export default Login;
