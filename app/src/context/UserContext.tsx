'use client';
import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/auth.service';

const UserContext = createContext<any>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
export const useUser = () => useContext(UserContext);
