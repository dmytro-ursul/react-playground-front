let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';

console.log('REACT_APP_API_URL from env:', process.env.REACT_APP_API_URL);
console.log('Initial apiUrl:', apiUrl);

// Ensure the URL has a protocol (https:// or http://)
if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
  apiUrl = 'https://' + apiUrl;
  console.log('Added https:// protocol, apiUrl is now:', apiUrl);
}

const AppSettings = {
  apiUrl: apiUrl + '/graphql',
};

console.log('Final API URL:', AppSettings.apiUrl);

export default AppSettings;
