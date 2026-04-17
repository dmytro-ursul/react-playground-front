let apiOrigin = process.env.REACT_APP_API_URL || 'localhost:3000';
// Strip protocol — the URL constructor inherits it from window.location.origin
apiOrigin = apiOrigin.replace(/^https?:\/\//, '');

const apiUrlObject = new URL(`//${apiOrigin}`, window.location.origin)
apiUrlObject.pathname = '/graphql'

const apiUrl = apiUrlObject.toString();

const AppSettings = {
  apiUrl,
};

export default AppSettings;
