import React, { createContext, useContext, useState, useEffect } from 'react';
import { hotelSettingsService, DEFAULT_HOTEL_SETTINGS } from '../services/hotelSettingsService';

const HotelSettingsContext = createContext({
  hotelSettings: DEFAULT_HOTEL_SETTINGS,
  loading: false,
  refreshSettings: () => {}
});

export function HotelSettingsProvider({ children }) {
  const [hotelSettings, setHotelSettings] = useState(DEFAULT_HOTEL_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Subscribe to live updates (including Realtime Supabase changes)
    const unsubscribe = hotelSettingsService.subscribe((newSettings) => {
      if (isMounted && newSettings) {
        setHotelSettings(newSettings);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refreshSettings = async () => {
    setLoading(true);
    const updated = await hotelSettingsService.getSettings(true);
    setHotelSettings(updated);
    setLoading(false);
  };

  return (
    <HotelSettingsContext.Provider value={{ hotelSettings, loading, refreshSettings }}>
      {children}
    </HotelSettingsContext.Provider>
  );
}

export function useHotelSettings() {
  const context = useContext(HotelSettingsContext);
  if (!context) {
    return { hotelSettings: DEFAULT_HOTEL_SETTINGS, loading: false, refreshSettings: () => {} };
  }
  return context;
}
