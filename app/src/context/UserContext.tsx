'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext<any>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    setUser(null); // 
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
export const useUser = () => useContext(UserContext);