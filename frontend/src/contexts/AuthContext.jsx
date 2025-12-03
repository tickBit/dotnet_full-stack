import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn_demo') === 'true');
  const [useremail, setUseremail] = useState(localStorage.getItem('useremail_demo') || '');
  const [token, setToken] = useState(localStorage.getItem('token_demo') || '');

  useEffect(() => {
    localStorage.setItem('isLoggedIn_demo', isLoggedIn.toString());
    localStorage.setItem('useremail_demo', useremail);
    localStorage.setItem('token_demo', token);
  }, [isLoggedIn, useremail, token]);

  const login = ( email, token ) => {
    setIsLoggedIn(true);
    setUseremail(email);
    setToken(token);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUseremail('');
    setToken('');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, useremail, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);