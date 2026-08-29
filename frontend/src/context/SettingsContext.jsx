import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { settingsAPI } from '../api';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data);
    } catch (e) {
      /* settings are optional at boot */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <SettingsContext.Provider value={{ settings, refresh }}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
