import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'librarian' | 'admin';
  isVerified: boolean;
  wishlist?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      if (res.data.success) {
        // Map backend _id to id
        const userObj = res.data.user;
        setUser({
          id: userObj._id,
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          isVerified: userObj.isVerified,
          wishlist: userObj.wishlist || [],
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        const userObj = res.data.user;
        setUser({
          id: userObj.id || userObj._id,
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          isVerified: userObj.isVerified,
        });
        return res.data;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        const userObj = res.data.user;
        setUser({
          id: userObj.id || userObj._id,
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          isVerified: userObj.isVerified,
        });
        return res.data;
      }
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    try {
      const res = await api.put('/auth/profile', data);
      if (res.data.success) {
        const updated = res.data.user;
        setUser((prev) => prev ? {
          ...prev,
          name: updated.name,
          email: updated.email,
          isVerified: updated.isVerified,
        } : null);
        return res.data;
      }
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
