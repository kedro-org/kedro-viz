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

// Helper to format bytes as B, KB, or MB
export function formatSize(bytes) {
  if (isNaN(bytes) || bytes === null) {
    return 'N/A';
  }

  const numBytes = Number(bytes);

  if (numBytes < 1024) {
    return `${numBytes}B`;
  }

  const kilobytes = numBytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes % 1 === 0 ? kilobytes : kilobytes.toFixed(2)}KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes % 1 === 0 ? megabytes : megabytes.toFixed(2)}MB`;
}
