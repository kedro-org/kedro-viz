// Helper to format seconds as Xm Ys
export function formatDuration(seconds) {
  if (isNaN(seconds)) {
    return 'N/A';
  }
  const totalSeconds = Math.floor(Number(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Number(seconds) - minutes * 60;
  const secsStr = secs % 1 === 0 ? String(secs) : secs.toFixed(2);
  if (minutes > 0) {
    return `${minutes}m ${secsStr}s`;
  }
  return `${secsStr}s`;
}

// Helper to format bytes as MB with up to 2 decimals
export function formatSize(bytes) {
  if (isNaN(bytes)) {
    return 'N/A';
  }
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes % 1 === 0 ? megabytes : megabytes.toFixed(2)}MB`;
}
