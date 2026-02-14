let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const AppSettings = {
  apiUrl: apiUrl + '/graphql',
};

export default AppSettings;
