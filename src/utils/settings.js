import { settings as settingsConfig } from '../config';

export const getSettingsState = (setting) => ({
  name: settingsConfig[setting].name,
  description: settingsConfig[setting].description,
});
