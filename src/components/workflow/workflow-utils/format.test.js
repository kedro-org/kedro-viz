import { formatDuration, formatSize } from './format';

describe('formatDuration', () => {
  it('formats seconds < 60', () => {
    expect(formatDuration(5)).toBe('5s');
    expect(formatDuration(59)).toBe('59s');
    expect(formatDuration(5.5)).toBe('5.5s');
  });
  it('formats minutes and seconds', () => {
    expect(formatDuration(65)).toBe('1m 5s');
    expect(formatDuration(125.25)).toBe('2m 5.25s');
  });
  it('returns N/A for NaN', () => {
    expect(formatDuration(NaN)).toBe('N/A');
  });
});

describe('formatSize', () => {
  it('formats bytes < 1024', () => {
    expect(formatSize(512)).toBe('512B');
  });
  it('formats kilobytes', () => {
    expect(formatSize(2048)).toBe('2KB');
    expect(formatSize(3072)).toBe('3KB');
    expect(formatSize(2500)).toBe('2.44KB');
  });
  it('formats megabytes', () => {
    expect(formatSize(1048576)).toBe('1MB');
    expect(formatSize(2097152)).toBe('2MB');
    expect(formatSize(1572864)).toBe('1.50MB');
  });
  it('returns N/A for NaN or null', () => {
    expect(formatSize(NaN)).toBe('N/A');
    expect(formatSize(null)).toBe('N/A');
  });
});
