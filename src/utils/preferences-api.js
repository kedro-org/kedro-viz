/**
 * Update user preferences for Kedro Viz.
 *
 * This function sends a POST request to the '/api/preferences' endpoint
 * to update the user preference settings
 *
 * @param {boolean} showDatasetPreviews - Indicates whether to show dataset previews.
 * @return {Promise<Object>} - A promise that resolves to the response data.
 * @throws {Error} - Throws an error if the API request fails.
 */
export const updatePreferences = async (showDatasetPreviews) => {
  try {
    const response = await fetch('/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        showDatasetPreviews,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

/**
 * Fetch preferences from the backend.
 * @return {Promise<Object>} Preferences object containing showDatasetPreviews.
 */
export const fetchPreferences = async () => {
  try {
    const response = await fetch('/api/preferences', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching preferences:', error);
    throw error;
  }
};
