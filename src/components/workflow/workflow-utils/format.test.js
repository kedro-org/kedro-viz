import { formatDuration, formatSize, formatTimestamp } from './format';
import timezoneMock from 'timezone-mock';

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

describe('formatTimestamp', () => {
  beforeAll(() => {
    // Set the timezone to Europe/London for consistent results (BST/GMT)
    timezoneMock.register('Europe/London');
  });

  afterAll(() => {
    timezoneMock.unregister();
  });

  it('formats ISO timestamp to dd.mm.yyyy - hh:mm:ss', () => {
    expect(formatTimestamp('2025-05-22T15:54:08.696715Z')).toBe(
      '22.05.2025 - 16:54:08 BST'
    );
  });
  it('pads single digits', () => {
    expect(formatTimestamp('2025-01-02T03:04:05.000Z')).toBe(
      '02.01.2025 - 03:04:05 GMT'
    );
  });
  it('returns N/A for empty', () => {
    expect(formatTimestamp('')).toBe('N/A');
    expect(formatTimestamp(null)).toBe('N/A');
  });
});
