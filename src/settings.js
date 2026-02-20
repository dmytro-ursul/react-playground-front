let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME;

if (!/^https?:\/\//i.test(apiUrl)) {
  const isProd = (railwayEnv || '').toLowerCase() === 'production';
  apiUrl = `${isProd ? 'https' : 'http'}://${apiUrl}`;
}

apiUrl = apiUrl.replace(/\/+$/, '');

const AppSettings = {
  apiUrl: apiUrl + '/graphql',
};

export default AppSettings;
