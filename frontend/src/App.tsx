import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Gallery from './pages/Gallery';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <>
      {!isLoggedIn ? (
        showRegister ? (
          <Register onRegisterSuccess={() => setShowRegister(false)} />
        ) : (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onRegisterClick={() => setShowRegister(true)}
          />
        )
      ) : (
        <Gallery onLogout={handleLogout} />
      )}
    </>
  );
};

export default App;
