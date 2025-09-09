import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext.tsx';

interface AdminContextType {
  isAdminLoggedIn: boolean;
  adminSession: {
    isAdmin: boolean;
    username: string;
    userId: string;
    email: string;
  } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { user, profile, isAdmin, signInAsAdmin, signOut } = useAuth();

  const adminSession = user && profile && isAdmin ? {
    isAdmin: true,
    username: profile.full_name || user.email?.split('@')[0] || 'Admin',
    userId: user.id,
    email: user.email || ''
  } : null;

  const login = async (email: string, password: string): Promise<boolean> => {
    return await signInAsAdmin(email, password);
  };

  const logout = async () => {
    await signOut();
  };

  const checkSession = (): boolean => {
    return isAdmin && !!user && !!profile;
  };

  const value: AdminContextType = {
    isAdminLoggedIn: isAdmin,
    adminSession,
    login,
    logout,
    checkSession
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
