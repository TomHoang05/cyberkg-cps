import { createContext, useContext, useState } from 'react';

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState(localStorage.getItem('cyberkg_role') || null);

  const selectRole = (r) => {
    setRole(r);
    localStorage.setItem('cyberkg_role', r);
  };

  const clearRole = () => {
    setRole(null);
    localStorage.removeItem('cyberkg_role');
  };

  return (
    <RoleContext.Provider value={{ role, selectRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
