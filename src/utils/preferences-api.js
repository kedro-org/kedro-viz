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
