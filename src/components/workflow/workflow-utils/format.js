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

export function formatTimestamp(timestamp) {
  if (!timestamp) {
    return 'N/A';
  }

  // Pads a number to 2 digits with a leading zero if needed (e.g., 3 -> '03', 12 -> '12')
  const pad2 = (num) => num.toString().padStart(2, '0');

  const date = new Date(timestamp);
  const day = pad2(date.getUTCDate());
  const month = pad2(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();
  const hour = pad2(date.getUTCHours());
  const minute = pad2(date.getUTCMinutes());
  const second = pad2(date.getUTCSeconds());

  return `${day}.${month}.${year} - ${hour}:${minute}:${second} UTC`;
}
