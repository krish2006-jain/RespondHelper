import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            setProfile(res.data.profile);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session expired or error fetching profile:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const { user: loggedInUser, profile: userProfile, accessToken, refreshToken } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setProfile(userProfile);
    return loggedInUser;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    const { user: registeredUser, accessToken, refreshToken } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(registeredUser));
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Ignore error on logout
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
  };

  const updateLocation = async (lat, lng, address) => {
    try {
      const res = await authAPI.updateLocation({ lat, lng, address });
      setUser((prev) => (prev ? { ...prev, location: res.data.location, address: res.data.address } : null));
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  };

  const isVerified = () => {
    if (!user) return false;
    if (user.role === 'survivor' || user.role === 'admin') return true;
    return user.verificationStatus === 'verified';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        updateLocation,
        isVerified,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
