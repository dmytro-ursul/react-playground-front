# React Playground Frontend

This is the React frontend for the React Playground application. It has been separated from the Rails backend for better organization and deployment flexibility.

## 🚀 Quick Start

### Development
```bash
npm install
npm start
```

### Production Build
```bash
npm install
npm run build
```

### Testing
```bash
npm test
```

## 🏗️ Architecture

This React application communicates with the Rails GraphQL API backend. The backend should be running separately.

### Environment Variables

Create a `.env` file in this directory with:

```bash
REACT_APP_API_URL=http://localhost:3000/graphql
```

For production deployment, set:
```bash
REACT_APP_API_URL=https://your-backend-url.railway.app/graphql
```

## 📁 Project Structure

```
src/
├── components/          # React components
├── handlers/           # API handlers
├── mocks/             # MSW mocks for testing
├── styles/            # CSS styles
├── App.jsx            # Main App component
├── index.js           # Entry point
└── store.ts           # Redux store
```

## 🚢 Deployment

This frontend is configured for Railway deployment using `railway-frontend.toml`.

### Railway Deployment
1. Create a new Railway service
2. Connect this repository
3. Set the root directory to this frontend folder
4. Set environment variables:
   - `REACT_APP_API_URL=https://your-backend.railway.app/graphql`

## 🔗 Backend Connection

The frontend connects to the Rails GraphQL API. Make sure the backend is running and accessible at the URL specified in `REACT_APP_API_URL`.

### Demo Credentials
```
Username: john.doe
Password: password
```
