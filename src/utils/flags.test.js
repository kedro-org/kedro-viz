import { Flags, getFlagsFromUrl, getFlagsMessage } from './flags';

const testFlagName = 'testflag';
const testFlagDescription = 'testflag description';

jest.mock('../config', () => ({
  ...jest.requireActual('../config'),
  flags: {
    testflag: {
      description: 'testflag description',
      default: false,
      icon: '🤖'
    }
  }
}));

describe('flags', () => {
  it('getFlagsFromUrl enables flags', () => {
    expect(
      getFlagsFromUrl(`https://localhost:4141/?${testFlagName}=true`)
    ).toEqual({
      [testFlagName]: true
    });

    expect(
      getFlagsFromUrl(`https://localhost:4141/?${testFlagName}=1`)
    ).toEqual({
      [testFlagName]: true
    });

    expect(getFlagsFromUrl(`https://localhost:4141/?${testFlagName}`)).toEqual({
      [testFlagName]: true
    });
  });

  it('getFlagsFromUrl disables flags', () => {
    expect(
      getFlagsFromUrl(`https://localhost:4141/?${testFlagName}=false`)
    ).toEqual({
      [testFlagName]: false
    });

    expect(
      getFlagsFromUrl(`https://localhost:4141/?${testFlagName}=0`)
    ).toEqual({
      [testFlagName]: false
    });
  });

  it('getFlagsMessage outputs a message describing flags', () => {
    expect(
      getFlagsMessage({
        [testFlagName]: true
      }).includes(testFlagDescription)
    ).toBe(true);
  });

  it('Flags.isDefined returns true if flag defined else false', () => {
    expect(Flags.isDefined(testFlagName)).toBe(true);
    expect(Flags.isDefined('definitelynotdefined')).toBe(false);
  });

  it('Flags.names returns list of defined flags names', () => {
    expect(Flags.names()).toEqual([testFlagName]);
  });

  it('Flags.defaults returns an object mapping flag defaults', () => {
    expect(Flags.defaults()).toEqual({ [testFlagName]: false });
  });
});
