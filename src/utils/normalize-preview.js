/**
 * Utility function to normalize preview data for both DataNode and TaskNode
 * Converts preview type strings to a consistent format
 *
 * @param {Object} metadata - The metadata object containing preview data
 * @returns {Object|null} Normalized preview object with { kind, content, meta, isDataNode } or null
 */
export const normalizePreview = (metadata) => {
  if (!(metadata && metadata?.preview)) {
    return null;
  }

  // DataNode previews
  if (Object.hasOwn(metadata, 'previewType') && metadata.previewType) {
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
      meta: {},
      isDataNode: true,
    };
  }

  // TaskNode previews
  if (Object.hasOwn(metadata.preview, 'kind') && metadata.preview.kind) {
    return {
      kind: metadata.preview.kind,
      content: metadata.preview.content,
      meta: metadata.preview.meta || {},
      isDataNode: false,
    };
  }

  return null;
};
