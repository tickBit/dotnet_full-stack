import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { refreshAccessToken } from '../services/api';

const AuthContext = createContext();

let logoutTimer;

function parseJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
  } catch {
    return null;
  }
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

  const [isExpired, setIsExpired] = useState(false);
  
  const logout = useCallback((expired = false) => {
    setIsLoggedIn(false);
    setUseremail('');
    setToken('');
    setIsExpired(expired);
    localStorage.removeItem('isLoggedIn_demo');
    localStorage.removeItem('useremail_demo');
    localStorage.removeItem('token_demo');

    if (logoutTimer) {
      clearTimeout(logoutTimer);
      logoutTimer = null;
    }

    if (!expired) {
      api.post('/api/users/logout').catch((error) => {
        console.error('Could not revoke the refresh token on the server.', error);
      });
    }
  }, []);
  
  // save to localStorage, when state changes
  useEffect(() => {
    localStorage.setItem('isLoggedIn_demo', isLoggedIn.toString());
    localStorage.setItem('useremail_demo', useremail);
    localStorage.setItem('token_demo', token);
  }, [isLoggedIn, useremail, token]);

  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      setToken(event.detail);
      setIsLoggedIn(true);
    };
    const handleRefreshFailed = () => logout(true);

    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth:refresh-failed', handleRefreshFailed);

    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth:refresh-failed', handleRefreshFailed);
    };
  }, [logout]);

  // Renew before expiration, including when restoring a saved session.
  useEffect(() => {
    if (!token) {
      if (isLoggedIn) {
        refreshAccessToken().catch((error) => {
          if (error.response?.status !== 401) {
            console.error('Could not restore the session.', error);
          }
        });
      }
      return undefined;
    }

    const remaining = getRemainingTime(token);
    const refreshIn = Math.max(remaining - 60_000, 0);
    logoutTimer = setTimeout(() => {
      refreshAccessToken().catch((error) => {
        if (error.response?.status !== 401) {
          console.error('Could not refresh the session.', error);
        }
      });
    }, refreshIn);

    return () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
      }
    };
  }, [isLoggedIn, token]);

  const login = (email, token) => {
    setIsLoggedIn(true);
    setUseremail(email);
    setToken(token);
    setIsExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, useremail, token, isExpired, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
