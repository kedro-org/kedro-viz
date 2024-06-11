export const getFilteredPlatforms = (hostingPlatforms, platformsKeys) => {
  const filteredPlatforms = {};
  platformsKeys.forEach((key) => {
    if (hostingPlatforms.hasOwnProperty(key)) {
      filteredPlatforms[key] = hostingPlatforms[key];
    }
  });

  return filteredPlatforms;
};

/**
 * Gets the deployment state message based on the type requested.
 *
 * @param {string} type - The type of message to return ('title' or 'message').
 * @param {string} deploymentState - The current deployment state.
 * @param {Object} compatibilityData - Data containing the package version.
 * @param {Function} modalMessages - Function to get modal messages based on deployment state and package version.
 * @returns {string|null} - The message based on the deployment state and type, or null for default/published states.
 */
export const getDeploymentStateByType = (
  type,
  deploymentState,
  compatibilityData,
  modalMessages
) => {
  // This is because the default and published view has its own style
  if (deploymentState === 'default' || deploymentState === 'published') {
    return null;
  }

  if (type === 'title') {
    return deploymentState === 'success'
      ? 'Kedro-Viz successfully hosted and published'
      : 'Publish and Share Kedro-Viz';
  }

  if (type === 'message') {
    return modalMessages(deploymentState, compatibilityData.package_version);
  }
};

export const handleResponseUrl = (responseUrl, platform) => {
  // If the URL does not start with http:// or https://, append http:// to avoid relative path issue for GCP platform.
  if (!/^https?:\/\//.test(responseUrl) && platform === 'gcp') {
    const url = 'http://' + responseUrl;
    return url;
  }
  return responseUrl;
};
