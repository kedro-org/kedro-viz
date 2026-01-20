/**
 * Utility function to normalize preview data
 * Converts preview type strings to a consistent format
 *
 * @param {Object} metadata - The metadata object containing preview data
 * @param {boolean} showDatasetPreviews - Flag to determine if previews should be shown
 * @returns {Object|null} Normalized preview object with { kind, content } or null
 */
export const normalizePreview = (metadata, showDatasetPreviews) => {
  if (!metadata || !showDatasetPreviews) {
    return null;
  }

  // Check for preview
  if (metadata.preview && metadata.previewType) {
    const previewType = metadata.previewType;

    // Map preview types to normalized format
    const typeMap = {
      PlotlyPreview: 'plotly',
      ImagePreview: 'image',
      TablePreview: 'table',
      JSONPreview: 'json',
      HTMLPreview: 'html',
    };

    return {
      kind:
        typeMap[previewType] ||
        previewType.toLowerCase().replace('preview', ''),
      content: metadata.preview,
    };
  }

  return null;
};
