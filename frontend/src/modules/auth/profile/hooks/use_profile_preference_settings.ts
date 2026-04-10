import { useEffect, useState } from 'react';

import { useAuthStore } from '../../store/auth_store';
import {
  loadProfilePreferenceSettings,
  PROFILE_SETTINGS_UPDATED_EVENT,
  type ProfilePreferenceSettings,
} from '../utils/profile_settings_storage';

export function useProfilePreferenceSettings(): ProfilePreferenceSettings {
  const userId = useAuthStore((state) => state.user?.id);
  const [settings, setSettings] = useState(() => loadProfilePreferenceSettings(userId));

  useEffect(() => {
    setSettings(loadProfilePreferenceSettings(userId));
  }, [userId]);

  useEffect(() => {
    const handlePreferenceChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ scope?: string; userId?: string }>).detail;
      if (detail?.scope && detail.scope !== 'preferences') {
        return;
      }
      if ((detail?.userId || 'anonymous') !== (userId || 'anonymous')) {
        return;
      }
      setSettings(loadProfilePreferenceSettings(userId));
    };

    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handlePreferenceChanged as EventListener);
    return () => window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handlePreferenceChanged as EventListener);
  }, [userId]);

  return settings;
}




