import React, { useState } from 'react';
import axios from 'axios';

interface RegisterProps {
    onRegisterSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        try {
            const res = await axios.post('http://15.206.73.143/api/register', { username, password });

            alert(res.data.message || '✅ Registration successful!');
            onRegisterSuccess();
        } catch (err: any) {
            alert('Registration failed: ' + (err?.response?.data?.message || 'Unknown error'));
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <h2 style={styles.title}>Register</h2>

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

                <button onClick={handleRegister} style={styles.button}>
                    Register
                </button>

                <p style={styles.text}>
                    Already have an account?{' '}
                    <span onClick={onRegisterSuccess} style={styles.linkButton}>
                        Login
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
        backgroundColor: '#28a745',
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
        color: '#007bff',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};

export default Register;
