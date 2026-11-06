import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Community, Category, Florist } from '../types';
import { repository } from '../services/repository';

interface MarketplaceContextType {
  communities: Community[];
  categories: Category[];
  florists: Florist[];
  selectedCommunity: Community | null;
  setSelectedCommunity: (community: Community | null) => void;
  refreshMarketplaceData: () => Promise<void>;
  resetAllDemoData: () => Promise<void>;
  getFloristsDeliveringToCommunity: (communityId: string) => Florist[];
  loading: boolean;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

const SELECTED_COMMUNITY_KEY = 'lunaria_selected_community_id';

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [florists, setFlorists] = useState<Florist[]>([]);
  const [selectedCommunity, setSelectedCommunityState] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMarketplaceData = useCallback(async () => {
    try {
      const [comms, cats, fls] = await Promise.all([
        repository.getCommunities(),
        repository.getCategories(),
        repository.getFlorists(),
      ]);
      setCommunities(comms);
      setCategories(cats);
      setFlorists(fls);

      // Restaurar comunidad seleccionada o tomar Tlaxcala Centro por defecto
      const savedCommId = localStorage.getItem(SELECTED_COMMUNITY_KEY);
      if (savedCommId) {
        const found = comms.find((c) => c.id === savedCommId && c.isActive);
        if (found) {
          setSelectedCommunityState(found);
          return;
        }
      }
      // Por defecto Tlaxcala Centro
      const defaultComm = comms.find((c) => c.id === 'com-tlaxcala-centro') || comms[0] || null;
      setSelectedCommunityState(defaultComm);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMarketplaceData();
  }, [refreshMarketplaceData]);

  const setSelectedCommunity = (comm: Community | null) => {
    setSelectedCommunityState(comm);
    if (comm) {
      localStorage.setItem(SELECTED_COMMUNITY_KEY, comm.id);
    } else {
      localStorage.removeItem(SELECTED_COMMUNITY_KEY);
    }
  };

  const resetAllDemoData = async () => {
    await repository.resetToInitialSeed();
    localStorage.removeItem(SELECTED_COMMUNITY_KEY);
    localStorage.removeItem('lunaria_current_user_id');
    localStorage.removeItem('lunaria_cart_items_v1');
    await refreshMarketplaceData();
    window.location.reload();
  };

  const getFloristsDeliveringToCommunity = (communityId: string): Florist[] => {
    return florists.filter(
      (f) =>
        f.status === 'approved' &&
        f.deliveryZones.some((dz) => dz.communityId === communityId && dz.isActive)
    );
  };

  return (
    <MarketplaceContext.Provider
      value={{
        communities,
        categories,
        florists,
        selectedCommunity,
        setSelectedCommunity,
        refreshMarketplaceData,
        resetAllDemoData,
        getFloristsDeliveringToCommunity,
        loading,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace debe ser utilizado dentro de un MarketplaceProvider');
  }
  return context;
};
