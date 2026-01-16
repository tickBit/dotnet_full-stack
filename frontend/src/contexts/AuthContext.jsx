import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

let logoutTimer;

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;

  return Date.now() >= payload.exp * 1000;
}

function getRemainingTime(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return 0;

  return payload.exp * 1000 - Date.now();
}

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isLoggedIn_demo') === 'true'
  );
  const [useremail, setUseremail] = useState(
    localStorage.getItem('useremail_demo') || ''
  );
  const [token, setToken] = useState(
    localStorage.getItem('token_demo') || ''
  );

  const scheduleAutoLogout = useCallback((token) => {
  
    const remaining = getRemainingTime(token);

    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }

    if (remaining > 0) {
        logoutTimer = setTimeout(() => {
        logout();
      }, remaining);
    }
  }, []);
  
  // save to localStorage, when state changes
  useEffect(() => {
    localStorage.setItem('isLoggedIn_demo', isLoggedIn.toString());
    localStorage.setItem('useremail_demo', useremail);
    localStorage.setItem('token_demo', token);
  }, [isLoggedIn, useremail, token]);

  // expiry check
  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        logout();
      } else {
        scheduleAutoLogout(token);
      }
    }
  }, [scheduleAutoLogout, token]);

  const login = (email, token) => {
    setIsLoggedIn(true);
    setUseremail(email);
    setToken(token);

    if (!isTokenExpired(token)) {
      scheduleAutoLogout(token);
    } else {
      logout();
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUseremail('');
    setToken('');

    if (logoutTimer) {
      clearTimeout(logoutTimer);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, useremail, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
