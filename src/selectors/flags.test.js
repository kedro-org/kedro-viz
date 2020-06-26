import { getCurrentFlags } from './flags';

describe('getCurrentFlags function', () => {
  it('should return the current flags from state', () => {
    const flags = getCurrentFlags({
      flags: { mockFlagA: true, mockFlagB: false }
    });
    expect(flags).toEqual({ mockFlagA: true, mockFlagB: false });
  });
});
