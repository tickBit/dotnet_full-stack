import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn_demo') === 'true');
  const [username, setUsername] = useState(localStorage.getItem('username_demo') || '');
  const [token, setToken] = useState(localStorage.getItem('token_demo') || '');

  useEffect(() => {
    localStorage.setItem('isLoggedIn_demo', isLoggedIn.toString());
    localStorage.setItem('username_demo', username);
    localStorage.setItem('token_demo', token);
  }, [isLoggedIn, username, token]);

  const login = ( name, token ) => {
    setIsLoggedIn(true);
    setUsername(name);
    setToken(token);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setToken('');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);