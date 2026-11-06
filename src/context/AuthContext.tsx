import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { repository } from '../services/repository';
import { INITIAL_PROFILES } from '../data/seedData';

interface AuthContextType {
  currentUser: Profile;
  allDemoProfiles: Profile[];
  switchDemoUser: (profileId: string) => Promise<void>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<Profile>;
  loginAs: (role: UserRole) => Promise<void>;
  logout: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'lunaria_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Por defecto, iniciamos como Mariana Herrera (Compradora de Tlaxcala Centro)
  const defaultBuyer = INITIAL_PROFILES.find((p) => p.id === 'user-buyer-mariana') || INITIAL_PROFILES[4];
  const [currentUser, setCurrentUser] = useState<Profile>(defaultBuyer);
  const [allDemoProfiles, setAllDemoProfiles] = useState<Profile[]>(INITIAL_PROFILES);

  useEffect(() => {
    async function loadUser() {
      const profiles = await repository.getProfiles();
      setAllDemoProfiles(profiles);

      const savedId = localStorage.getItem(CURRENT_USER_KEY);
      if (savedId) {
        const found = profiles.find((p) => p.id === savedId);
        if (found) {
          setCurrentUser(found);
          return;
        }
      }
    }
    loadUser();
  }, []);

  const switchDemoUser = async (profileId: string) => {
    const profiles = await repository.getProfiles();
    const target = profiles.find((p) => p.id === profileId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(CURRENT_USER_KEY, target.id);
    }
  };

  const loginAs = async (role: UserRole) => {
    const profiles = await repository.getProfiles();
    const candidate = profiles.find((p) => p.role === role);
    if (candidate) {
      setCurrentUser(candidate);
      localStorage.setItem(CURRENT_USER_KEY, candidate.id);
    }
  };

  const updateCurrentProfile = async (updates: Partial<Profile>): Promise<Profile> => {
    const updated: Profile = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const saved = await repository.saveProfile(updated);
    setCurrentUser(saved);
    const profiles = await repository.getProfiles();
    setAllDemoProfiles(profiles);
    return saved;
  };

  const logout = () => {
    // Regresa al comprador default
    const buyer = allDemoProfiles.find((p) => p.id === 'user-buyer-mariana') || allDemoProfiles[0];
    setCurrentUser(buyer);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allDemoProfiles,
        switchDemoUser,
        updateCurrentProfile,
        loginAs,
        logout,
        isDemoMode: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
