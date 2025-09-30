let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Ensure the URL has a protocol (https:// or http://)
if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = 'https://' + apiUrl;
}

const AppSettings = {
  apiUrl: apiUrl + '/graphql',
};

export default AppSettings;
