/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, getCurrentUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    const { access_token } = await loginUser(email, password);
    localStorage.setItem('token', access_token);
    
    // Decode token for immediate state update to unblock UI
    try {
      const base64Url = access_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      
      // Provide basic user info immediately from token
      setUser({ id: payload.sub, role: { role_name: payload.role } });
    } catch (e) {
      console.error("Error parsing JWT token:", e);
    }
    
    setIsAuthenticated(true);

    // Fetch full user details in the background without blocking login
    getCurrentUser().then(userData => {
      setUser(userData);
    }).catch(err => {
      console.error("Failed to fetch user details after login:", err);
    });
    
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentPredictionId');
    setUser(null);
    setIsAuthenticated(false);
  };

  const userRole = user?.role?.role_name || user?.role;
  const isAdmin = userRole === 'admin';
  const isFarmer = userRole === 'user' || userRole === 'farmer';

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, isLoading, login, logout, isAdmin, isFarmer }}>
      {children}
    </AuthContext.Provider>
  );
};
