const AppSettings = {
  apiUrl:
    process.env.NODE_ENV === 'test'
      ? process.env.REACT_APP_MOCK_API_URL || 'http://localhost:3001/graphql'
      : process.env.REACT_APP_API_URL || 'http://localhost:3001/graphql',
};

export default AppSettings;
