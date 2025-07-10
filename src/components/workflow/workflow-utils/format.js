// Helper to format a number, removing unnecessary trailing zeros (e.g., 1.50 -> 1.5, 2.00 -> 2)
export function formatNumber(num) {
  return num % 1 === 0
    ? String(num)
    : Number(num)
        .toFixed(2)
        .replace(/\.?0+$/, '');
}

// Helper to format seconds as Xm Ys or ms for sub-second durations
export function formatDuration(seconds) {
  if (isNaN(seconds)) {
    return 'N/A';
  }

  const numSeconds = Number(seconds);

  // If duration is less than 1 second, format as milliseconds
  if (numSeconds < 1) {
    const milliseconds = Math.round(numSeconds * 1000);
    return `${milliseconds}ms`;
  }

  const totalSeconds = Math.floor(numSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = numSeconds - minutes * 60;
  const secsStr = formatNumber(secs);
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
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());

  // Get the local timezone abbreviation, fallback to 'UTC' if unavailable
  const tzLabel =
    date
      .toLocaleTimeString(undefined, { timeZoneName: 'short' })
      .split(' ')
      .pop() || 'UTC';

  return `${day}.${month}.${year} - ${hour}:${minute}:${second} ${tzLabel}`;
}
