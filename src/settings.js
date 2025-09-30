const AppSettings = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
};

// Add /graphql path to the API URL
AppSettings.apiUrl = AppSettings.apiUrl + '/graphql';

export default AppSettings;
