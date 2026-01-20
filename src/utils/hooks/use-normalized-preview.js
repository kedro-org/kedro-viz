/**
 * Hook to normalize preview data
 */
export const useNormalizedPreview = (metadata, showDatasetPreviews) => {
  if (!metadata || !showDatasetPreviews) {
    return null;
  }

  // Check for DataNode preview
  if (metadata.preview && metadata.previewType) {
    const previewType = metadata.previewType;

    // Map DataNode preview types to normalized format
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
