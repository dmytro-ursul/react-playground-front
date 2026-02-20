let apiOrigin = process.env.REACT_APP_API_URL || 'localhost:3000';

const apiUrlObject = new URL(`//${apiOrigin}`, window.location.origin)
apiUrlObject.pathname = '/graphql'

const apiUrl = apiUrlObject.toString();

const AppSettings = {
  apiUrl,
};

export default AppSettings;
