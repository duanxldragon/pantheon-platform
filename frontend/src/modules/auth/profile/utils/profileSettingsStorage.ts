export interface ProfilePreferenceSettings {
  pageSize: string;
  autoRefresh: boolean;
  compactMode: boolean;
}

export interface ProfilePrivacySettings {
  showProfile: boolean;
  showLastLogin: boolean;
  allowSearch: boolean;
  shareActivity: boolean;
  collectUsage: boolean;
  allowThirdPartySharing: boolean;
}

export interface ProfileNotificationOptionSettings {
  id: string;
  email: boolean;
  system: boolean;
}

export interface ProfileNotificationSettings {
  notifications: ProfileNotificationOptionSettings[];
  quietHours: boolean;
}

export const DEFAULT_PREFERENCE_SETTINGS: ProfilePreferenceSettings = {
  pageSize: '20',
  autoRefresh: true,
  compactMode: false,
};

export const DEFAULT_PRIVACY_SETTINGS: ProfilePrivacySettings = {
  showProfile: true,
  showLastLogin: true,
  allowSearch: true,
  shareActivity: false,
  collectUsage: true,
  allowThirdPartySharing: false,
};

export const DEFAULT_NOTIFICATION_SETTINGS: ProfileNotificationSettings = {
  notifications: [
    { id: 'system-alert', email: true, system: true },
    { id: 'task-update', email: true, system: true },
    { id: 'security', email: true, system: true },
    { id: 'release', email: false, system: true },
  ],
  quietHours: false,
};

export const PROFILE_SETTINGS_UPDATED_EVENT = 'pantheon:profile-settings-updated';

function buildStorageKey(scope: 'preferences' | 'privacy' | 'notifications', userId?: string | number) {
  return `profile:${scope}:${userId || 'anonymous'}`;
}

function loadSettings<T>(scope: 'preferences' | 'privacy' | 'notifications', defaults: T, userId?: string | number): T {
  try {
    const raw = localStorage.getItem(buildStorageKey(scope, userId));
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaults;
    }

    return {
      ...defaults,
      ...parsed,
    };
  } catch {
    return defaults;
  }
}

function saveSettings<T>(scope: 'preferences' | 'privacy' | 'notifications', settings: T, userId?: string | number) {
  localStorage.setItem(buildStorageKey(scope, userId), JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent(PROFILE_SETTINGS_UPDATED_EVENT, {
      detail: {
        scope,
        userId: userId || 'anonymous',
      },
    }),
  );
}

export function loadProfilePreferenceSettings(userId?: string): ProfilePreferenceSettings {
  return loadSettings('preferences', DEFAULT_PREFERENCE_SETTINGS, userId);
}

export function saveProfilePreferenceSettings(settings: ProfilePreferenceSettings, userId?: string) {
  saveSettings('preferences', settings, userId);
}

export function loadProfilePrivacySettings(userId?: string): ProfilePrivacySettings {
  return loadSettings('privacy', DEFAULT_PRIVACY_SETTINGS, userId);
}

export function saveProfilePrivacySettings(settings: ProfilePrivacySettings, userId?: string) {
  saveSettings('privacy', settings, userId);
}

export function loadProfileNotificationSettings(userId?: string): ProfileNotificationSettings {
  return loadSettings('notifications', DEFAULT_NOTIFICATION_SETTINGS, userId);
}

export function saveProfileNotificationSettings(settings: ProfileNotificationSettings, userId?: string) {
  saveSettings('notifications', settings, userId);
}
