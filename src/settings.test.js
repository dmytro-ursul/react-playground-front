const loadSettings = () => {
  jest.resetModules();
  return require('./settings').default;
};

describe('AppSettings.apiUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('builds apiUrl from host when scheme is missing', () => {
    process.env.REACT_APP_API_URL = 'api.example.com';

    const settings = loadSettings();
    expect(settings.apiUrl).toBe('http://api.example.com/graphql');
  });

  test('strips protocol before using URL with //', () => {
    process.env.REACT_APP_API_URL = 'api.example.com/graphql';

    const settings = loadSettings();
    expect(settings.apiUrl).toBe('http://api.example.com/graphql');
  });

  test('keeps host when graphql path is provided', () => {
    process.env.REACT_APP_API_URL = 'api.example.com/graphql';

    const settings = loadSettings();
    expect(settings.apiUrl).toBe('http://api.example.com/graphql');
  });

});
